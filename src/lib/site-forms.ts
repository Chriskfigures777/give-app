/**
 * Injects a small script into website pages to capture template forms and submit them
 * to the platform's public forms endpoint (cross-origin safe).
 *
 * Forms in templates today use `onsubmit="event.preventDefault();alert('...')"`.
 * This script overrides all <form> elements on the page so they POST to /api/public/forms/submit.
 */

function escapeJsString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export function buildFormsScript(orgSlug: string): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!appUrl) return "";

  return `<script data-give-forms="1">(function(){
var ORG="${escapeJsString(orgSlug)}";
var AU="${escapeJsString(appUrl)}";
function text(s){return(s||"").toString().trim();}
function guessKey(el){
  if(!el) return null;
  var n=el.getAttribute("name"); if(n) return n;
  var id=el.getAttribute("id"); if(id) return id;
  var ph=el.getAttribute("placeholder"); if(ph) return ph;
  try{var lbl=el.closest&&el.closest(".form-group,.form-field,.field");if(lbl){var lab=lbl.querySelector("label");if(lab&&text(lab.textContent))return text(lab.textContent);}}catch(e){}
  try{var p=el.parentElement;if(p){var lab=p.querySelector("label");if(lab&&text(lab.textContent))return text(lab.textContent);}}catch(e){}
  return(el.getAttribute("type")||el.tagName||"field").toLowerCase();
}
function collect(form){
  var f={};
  var els=form.querySelectorAll("input,textarea,select");
  for(var i=0;i<els.length;i++){
    var el=els[i];if(!el||el.disabled)continue;
    var tag=(el.tagName||"").toLowerCase();
    var type=((el.getAttribute("type")||"")+"").toLowerCase();
    if(tag==="input"&&(type==="submit"||type==="button"||type==="hidden"))continue;
    var key=guessKey(el);if(!key)continue;
    var val="";
    if(tag==="select") val=el.value;
    else if(tag==="textarea") val=el.value;
    else if(type==="checkbox") val=el.checked?"true":"false";
    else if(type==="radio"){if(!el.checked)continue;val=el.value;}
    else val=el.value;
    if(val===undefined||val===null)continue;
    f[key]=val;
  }
  return f;
}
function findByType(form,type){
  var els=form.querySelectorAll('input[type="'+type+'"]');
  for(var i=0;i<els.length;i++){var v=text(els[i].value);if(v)return v;}
  return null;
}
function findTextarea(form){
  var t=form.querySelector("textarea");
  return t?text(t.value):null;
}
function findName(form){
  var namePatterns=["name","full-name","full_name","fullname","your-name"];
  var firstPatterns=["first-name","first_name","firstname","fname","first"];
  var lastPatterns=["last-name","last_name","lastname","lname","last"];
  function byAttr(patterns){
    for(var p=0;p<patterns.length;p++){
      var el=form.querySelector('input[name="'+patterns[p]+'"],input[id="'+patterns[p]+'"]');
      if(el&&text(el.value))return text(el.value);
    }
    return null;
  }
  var full=byAttr(namePatterns);
  if(full)return full;
  var first=byAttr(firstPatterns);
  var last=byAttr(lastPatterns);
  if(first&&last)return first+" "+last;
  if(first)return first;
  if(last)return last;
  var txt=form.querySelector('input[type="text"]');
  return txt?text(txt.value):null;
}
function handleSubmit(e){
  e.preventDefault();e.stopPropagation();
  var form=e.target;if(!form||form.tagName!=="FORM")return;
  var fields=collect(form);
  var email=findByType(form,"email");
  var name=findName(form);
  var phone=findByType(form,"tel");
  var message=findTextarea(form);
  if(!email){alert("Please enter an email address.");return;}
  if(message)fields["Message"]=message;
  var btn=form.querySelector('button[type="submit"],input[type="submit"],button:not([type])');
  var origText=btn?btn.textContent||btn.value:"";
  if(btn){btn.disabled=true;if(btn.tagName==="INPUT")btn.value="Sending...";else btn.textContent="Sending...";}
  fetch(AU+"/api/public/forms/submit",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    mode:"cors",
    body:JSON.stringify({
      orgSlug:ORG,
      visitorEmail:email,
      visitorName:name||null,
      visitorPhone:phone||null,
      formKind:null,
      pagePath:location.href,
      fields:fields
    })
  }).then(function(r){return r.json();}).then(function(d){
    if(d.ok){
      form.reset();
      var msg=document.createElement("div");
      msg.style.cssText="padding:16px;border-radius:10px;background:#ecfdf5;color:#065f46;font-weight:600;text-align:center;margin-top:12px;";
      msg.textContent="Thank you! We'll be in touch.";
      form.appendChild(msg);
      setTimeout(function(){try{msg.remove();}catch(e){}},6000);
    }else{alert(d.error||"Something went wrong. Please try again.");}
    if(btn){btn.disabled=false;if(btn.tagName==="INPUT")btn.value=origText;else btn.textContent=origText;}
  }).catch(function(){
    alert("Network error. Please try again.");
    if(btn){btn.disabled=false;if(btn.tagName==="INPUT")btn.value=origText;else btn.textContent=origText;}
  });
}
function bind(){
  var forms=document.querySelectorAll("form");
  for(var i=0;i<forms.length;i++){
    var f=forms[i];
    if(f.getAttribute("data-give-bound"))continue;
    f.setAttribute("data-give-bound","1");
    f.removeAttribute("onsubmit");
    f.setAttribute("action","javascript:void(0)");
    f.removeAttribute("method");
    var submitBtn=f.querySelector('button[type="submit"],input[type="submit"]');
    if(submitBtn)submitBtn.removeAttribute("formaction");
    f.addEventListener("submit",handleSubmit,true);
  }
}
bind();
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",bind);
var mo=new MutationObserver(bind);
mo.observe(document.body||document.documentElement,{childList:true,subtree:true});
})();</script>`;
}

/**
 * Inject the form script before </body> in the given HTML.
 * Safe to call on pages without forms (the script is small and self-checks).
 */
export function injectFormsScript(html: string, orgSlug: string): string {
  const script = buildFormsScript(orgSlug);
  if (!script) return html;

  if (html.includes("</body>")) {
    return html.replace("</body>", script + "\n</body>");
  }
  return html + script;
}
