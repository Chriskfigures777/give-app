/**
 * Public survey pages should always render in light mode regardless of
 * the dashboard theme the org admin has chosen.
 */
export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){document.documentElement.classList.remove('dark');document.documentElement.removeAttribute('data-dashboard-theme');})();`,
        }}
      />
      {children}
    </>
  );
}
