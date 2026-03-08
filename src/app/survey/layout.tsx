import { DashboardThemeScript } from "@/components/dashboard-theme-script";

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardThemeScript />
      {children}
    </>
  );
}
