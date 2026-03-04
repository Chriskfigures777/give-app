/**
 * Runs before paint on dashboard pages. Reads stored theme and sets data-dashboard-theme + dark class
 * to prevent flash of wrong theme. Only runs when this script is included (dashboard layout).
 */
export function DashboardThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('give-dashboard-theme');var valid=['light','dark','purple','green','dark-gray','blue'].indexOf(t)>=0;var theme=valid?t:'dark';document.documentElement.setAttribute('data-dashboard-theme',theme);if(['dark','purple','dark-gray','blue'].indexOf(theme)>=0)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`,
      }}
    />
  );
}
