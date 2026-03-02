"use client";

import { useState } from "react";
import { QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  slug: string;
  organizationName: string;
};

export function GivePageQRCode({ slug, organizationName }: Props) {
  const [open, setOpen] = useState(false);
  const qrUrl = `/api/qr?slug=${encodeURIComponent(slug)}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-slate-600 hover:text-slate-900"
        >
          <QrCode className="h-4 w-4" />
          Get QR code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share your give page</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-sm text-slate-600 text-center">
            Scan to give to {organizationName}. Share at events, presentations, or on printed materials.
          </p>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <img
              src={qrUrl}
              alt={`QR code for ${organizationName} give page`}
              className="h-48 w-48"
              width={192}
              height={192}
            />
          </div>
          <a
            href={qrUrl}
            download={`give-${slug}-qr.png`}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
