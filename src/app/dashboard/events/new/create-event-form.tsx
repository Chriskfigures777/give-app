"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  organizationId: string;
  organizationName: string;
};

export function CreateEventForm({ organizationId, organizationName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [onlineEvent, setOnlineEvent] = useState(false);
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ticketFree, setTicketFree] = useState(true);
  const [ticketName, setTicketName] = useState("General Admission");
  const [ticketQuantity, setTicketQuantity] = useState(100);
  const [ticketPriceCents, setTicketPriceCents] = useState(0);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slug || slug === slugFromName(name)) {
      setSlug(slugFromName(v));
    }
  };

  const slugFromName = (n: string) =>
    n
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const ticketClasses = [
      {
        name: ticketName || "General Admission",
        free: ticketFree,
        quantityTotal: Math.max(1, ticketQuantity),
        costCents: ticketFree ? undefined : ticketPriceCents,
      },
    ];

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          name: name.trim(),
          slug: slug.trim() || slugFromName(name),
          description: description.trim() || undefined,
          startAt,
          endAt,
          timezone,
          onlineEvent,
          venueName: venueName.trim() || undefined,
          venueAddress: venueAddress.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          ticketClasses,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create event");
        setLoading(false);
        return;
      }

      // Redirect to the new event page (uses ID in URL)
      if (data?.id) {
        router.push(`/events/${data.id}`);
      } else {
        router.push("/dashboard/events");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
      setLoading(false);
    }
  }

  const inputClass =
    "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Event name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Spring Gala 2025"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>URL slug (for internal use)</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="spring-gala-2025"
          className={inputClass}
        />
        <p className="text-xs text-slate-500 mt-1">
          Public URL uses a unique ID (e.g. /events/abc123...) — assigned after creation
        </p>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Event description..."
          rows={4}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start date & time</label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>End date & time</label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className={inputClass}
        >
          <option value="America/New_York">Eastern (America/New_York)</option>
          <option value="America/Chicago">Central (America/Chicago)</option>
          <option value="America/Denver">Mountain (America/Denver)</option>
          <option value="America/Los_Angeles">Pacific (America/Los_Angeles)</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={onlineEvent}
            onChange={(e) => setOnlineEvent(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span className={labelClass}>Online event</span>
        </label>
      </div>

      {!onlineEvent && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Venue name</label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="Main Hall"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Venue address</label>
            <input
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="123 Main St, City, State"
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Image URL (optional)</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </div>

      <div className="rounded-lg border border-slate-200 p-4 space-y-4">
        <h3 className="font-medium text-slate-900">Ticket</h3>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={ticketFree}
              onChange={(e) => setTicketFree(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm">Free ticket (RSVP)</span>
          </label>
        </div>
        <div>
          <label className={labelClass}>Ticket name</label>
          <input
            type="text"
            value={ticketName}
            onChange={(e) => setTicketName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Quantity available</label>
          <input
            type="number"
            min={1}
            value={ticketQuantity}
            onChange={(e) => setTicketQuantity(parseInt(e.target.value, 10) || 1)}
            className={inputClass}
          />
        </div>
        {!ticketFree && (
          <div>
            <label className={labelClass}>Price (USD)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={ticketPriceCents / 100}
              onChange={(e) =>
                setTicketPriceCents(Math.round(parseFloat(e.target.value || "0") * 100))
              }
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create event"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
