import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atpkddkjvvtfosuuoprm.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const ORG_ID = 'd13d2ffd-5982-4700-b6ef-282ef3b60735';
const USER_ID = '24fdcdaa-a578-47d9-b649-502caf04c4d8';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const NOTE_CONTENT = `Study Notes: Understanding Love in the Bible
Key Idea: Love in Scripture is not primarily a feeling. It is an action, commitment, and orientation toward others.
1. Love as the Core Command - Matthew 22:37-40
2. Greek Words: Agape (self-sacrificial, 1 Cor 13), Philia (friendship, John 15:13), Storge (family), Eros (Song of Solomon)
3. Love as Evidence of Faith - 1 John 4:7-8
4. Love and Sacrifice - Romans 5:8 - God demonstrates love while we were still sinners
5. Love as Practice - patience, kindness, forgiveness, generosity, hospitality`;

async function run() {
  let allPassed = true;

  console.log('=== Step 1: Verify org & ai_credits_purchased column ===');
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, plan, plan_status, ai_credits_purchased')
    .eq('id', ORG_ID).single();
  if (orgErr) { console.log('❌', orgErr.message); allPassed = false; }
  else console.log(`✅ Org: "${org.name}" | Plan: ${org.plan} (${org.plan_status}) | Purchased credits: ${org.ai_credits_purchased}`);

  console.log('\n=== Step 2: Check monthly usage cap (website plan = 20/mo) ===');
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: used } = await supabase
    .from('ai_usage_log').select('id', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID).eq('feature', 'generate_survey_questions')
    .gte('created_at', startOfMonth);
  const planCap = 20; // website plan
  const purchased = org?.ai_credits_purchased ?? 0;
  const totalCap = planCap + purchased;
  const remaining = Math.max(0, totalCap - (used ?? 0));
  console.log(`✅ Used: ${used}/${planCap} plan + ${purchased} purchased = ${remaining} remaining`);

  console.log('\n=== Step 3: Generate AI survey questions from notes ===');
  const client = new Anthropic({ apiKey: ANTHROPIC_KEY });
  const prompt = `You are helping a church create a survey. Generate exactly 5 survey questions based on the content below. Return ONLY a JSON array: [{"text":"question","type":"multiple_choice"|"short_answer","options":["A","B","C"]}]\n\nContent:\n${NOTE_CONTENT}`;
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  const raw = message.content.find(c => c.type === 'text')?.text?.trim() ?? '';
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  console.log(`✅ Generated ${questions.length} questions for "Understanding Love in the Bible":`);
  questions.forEach((q, i) => {
    console.log(`  ${i+1}. [${q.type}] ${q.text}`);
    if (q.options?.length) console.log(`     → ${q.options.join(' | ')}`);
  });

  console.log('\n=== Step 4: Log usage to ai_usage_log ===');
  const { error: insertErr } = await supabase.from('ai_usage_log').insert({
    organization_id: ORG_ID, user_id: USER_ID,
    feature: 'generate_survey_questions', units: 1,
  });
  if (insertErr) { console.log('❌', insertErr.message); allPassed = false; }
  else console.log('✅ Usage logged');

  console.log('\n=== Step 5: Verify updated count & remaining credits ===');
  const { count: newUsed } = await supabase
    .from('ai_usage_log').select('id', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID).eq('feature', 'generate_survey_questions')
    .gte('created_at', startOfMonth);
  console.log(`✅ Usage now: ${newUsed}/${totalCap} | Remaining: ${Math.max(0, totalCap - (newUsed ?? 0))}`);

  console.log('\n=== Step 6: Test decrement_ai_credits_purchased RPC ===');
  // First give org 5 test purchased credits
  await supabase.from('organizations').update({ ai_credits_purchased: 5 }).eq('id', ORG_ID);
  const { error: rpcErr } = await supabase.rpc('decrement_ai_credits_purchased', { org_id: ORG_ID });
  if (rpcErr) { console.log('❌ RPC error:', rpcErr.message); allPassed = false; }
  else {
    const { data: after } = await supabase.from('organizations').select('ai_credits_purchased').eq('id', ORG_ID).single();
    console.log(`✅ Purchased credits: 5 → ${after?.ai_credits_purchased} (decremented correctly)`);
  }
  // Reset to 0
  await supabase.from('organizations').update({ ai_credits_purchased: 0 }).eq('id', ORG_ID);

  console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'));
  console.log('User: cbfigureshouse@gmail.com | Org: Non Profit Go | Plan: website (20 credits/mo)');
}

run().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
