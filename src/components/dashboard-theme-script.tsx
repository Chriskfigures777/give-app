/**
 * Runs before paint on dashboard pages. Reads stored theme and sets html class
 * to prevent flash of wrong theme. Only runs when this script is included (dashboard layout).
 */
export function DashboardThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('give-dashboard-theme');if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`,
      }}
    />
  );
}
