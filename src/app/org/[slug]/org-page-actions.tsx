"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UserPlus, Heart, DollarSign, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type Status = {
  isAuthenticated: boolean;
  connectionStatus: "none" | "pending" | "connected";
  isSaved: boolean;
  userOrgId: string | null;
};

type Props = {
  organizationId: string;
  slug: string;
  embedModalUrl: string;
};

export function OrgPageActions({ organizationId, slug, embedModalUrl }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [donateModalOpen, setDonateModalOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/org-page-status?organizationId=${encodeURIComponent(organizationId)}`)
      .then((r) => r.json())
      .then((data) =>
        setStatus({
          isAuthenticated: data.isAuthenticated ?? false,
          connectionStatus: data.connectionStatus ?? "none",
          isSaved: data.isSaved ?? false,
          userOrgId: data.userOrgId ?? null,
        })
      )
      .catch(() =>
        setStatus({
          isAuthenticated: false,
          connectionStatus: "none",
          isSaved: false,
          userOrgId: null,
        })
      );
  }, [organizationId]);

  const handleConnect = async () => {
    if (!status?.isAuthenticated || status.userOrgId === organizationId) return;
    setLoading("connect");
    try {
      const res = await fetch("/api/peers/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: organizationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setStatus((s) => (s ? { ...s, connectionStatus: "pending" as const } : s));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send request");
    } finally {
      setLoading(null);
    }
  };

  const handleSave = async () => {
    if (!status?.isAuthenticated) {
      window.location.href = `/login?redirect=/org/${slug}`;
      return;
    }
    setLoading("save");
    try {
      if (status.isSaved) {
        const res = await fetch(`/api/donor/save-organization?slug=${encodeURIComponent(slug)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to unsave");
        setStatus((s) => (s ? { ...s, isSaved: false } : s));
      } else {
        const res = await fetch("/api/donor/save-organization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        setStatus((s) => (s ? { ...s, isSaved: true } : s));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  if (status === null) return null;

  const showConnect =
    status.isAuthenticated &&
    status.userOrgId &&
    status.userOrgId !== organizationId &&
    status.connectionStatus === "none";
  const connectPending = status.connectionStatus === "pending";
  const connectDone = status.connectionStatus === "connected";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {showConnect && (
        <Button
          onClick={handleConnect}
          disabled={loading === "connect"}
          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200 px-5"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Connect
        </Button>
      )}
      {connectPending && (
        <Button variant="outline" disabled className="rounded-full border-amber-200 bg-amber-50 text-amber-700 px-5">
          <Check className="h-4 w-4 mr-2" />
          Request sent
        </Button>
      )}
      {connectDone && (
        <Button variant="outline" disabled className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 px-5">
          <Check className="h-4 w-4 mr-2" />
          Connected
        </Button>
      )}

      <Button
        onClick={() => setDonateModalOpen(true)}
        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200 px-5"
      >
        <DollarSign className="h-4 w-4 mr-2" />
        Donate
      </Button>

      <Dialog open={donateModalOpen} onOpenChange={setDonateModalOpen}>
        <DialogContent
          className="max-w-[520px] w-[95vw] p-0 overflow-hidden rounded-2xl"
          showClose={true}
        >
          <DialogTitle className="sr-only">Donate</DialogTitle>
          <div className="min-h-[500px] max-h-[85vh] overflow-auto">
            <iframe
              src={embedModalUrl}
              title="Donation form"
              className="w-full min-h-[500px] border-0"
              style={{ height: "min(85vh, 700px)" }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {status.isAuthenticated && (
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={loading === "save"}
          className="rounded-full border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 px-5"
        >
          <Heart
            className={`h-4 w-4 mr-2 transition-colors ${status.isSaved ? "fill-rose-500 text-rose-500" : ""}`}
          />
          {status.isSaved ? "Saved" : "Save"}
        </Button>
      )}
      {!status.isAuthenticated && (
        <Button
          variant="outline"
          onClick={() => (window.location.href = `/login?redirect=/org/${slug}`)}
          className="rounded-full border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 px-5"
        >
          <Heart className="h-4 w-4 mr-2" />
          Save
        </Button>
      )}

      <Button
        variant="outline"
        onClick={handleShare}
        className="rounded-full border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 px-5"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
    </div>
  );
}
