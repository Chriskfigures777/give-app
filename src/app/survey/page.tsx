import type { Metadata } from "next";
import { SurveyClient } from "./survey-client";

export const metadata: Metadata = {
  title: "Church Giving Survey — Give",
  description:
    "Help us understand what churches need from a modern giving platform. Your responses shape the future of Give.",
};

export default function SurveyPage() {
  return <SurveyClient />;
}
