import { Metadata } from "next";
import { Suspense } from "react";
import { CommunityClient } from "./community-client";

export const metadata: Metadata = {
  title: "Community — GIVE",
  description: "Find and connect with donors, nonprofits, churches, and missionaries on GIVE.",
};

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityClient />
    </Suspense>
  );
}
