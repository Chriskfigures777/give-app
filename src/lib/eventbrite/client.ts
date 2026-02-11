const EVENTBRITE_API_BASE = "https://www.eventbriteapi.com/v3";

export type EventbriteOrg = {
  id: string;
  name: string;
};

export type EventbriteEvent = {
  id: string;
  name: { html: string; text: string };
  start: { timezone: string; utc: string };
  end: { timezone: string; utc: string };
  currency: string;
  online_event: boolean;
  url: string;
};

export type EventbriteTicketClass = {
  id: string;
  name: string;
  free: boolean;
  cost?: { major_value: string; currency: string };
  quantity_total: number;
};

async function eventbriteFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token: string;
  }
): Promise<T> {
  const { method = "GET", body, token } = options;
  const url = `${EVENTBRITE_API_BASE}${path}`;
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Eventbrite API ${res.status}: ${errText}`);
  }

  return res.json() as Promise<T>;
}

/** Get the authenticated user (requires OAuth token). */
export async function getEventbriteUser(accessToken: string): Promise<{
  id: string;
  name?: string;
}> {
  const data = await eventbriteFetch<{
    id: string;
    name?: string;
    profile?: { first_name?: string; last_name?: string };
  }>("/users/me/", { token: accessToken });
  const profile = data.profile;
  const name =
    data.name ??
    (profile?.first_name || profile?.last_name
      ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
      : undefined);
  return { id: data.id, name };
}

/** Get user's Eventbrite organizations (requires OAuth token). */
export async function getEventbriteOrganizations(
  accessToken: string
): Promise<EventbriteOrg[]> {
  const data = await eventbriteFetch<{ organizations: EventbriteOrg[] }>(
    "/users/me/organizations/",
    { token: accessToken }
  );
  return data.organizations ?? [];
}

/**
 * Get an Eventbrite organization ID for the token. Uses organizations list if
 * available; otherwise falls back to the user's own ID (Eventbrite uses
 * user_id as default org when user has no explicit organizations).
 */
export async function getEventbriteOrgId(accessToken: string): Promise<{
  orgId: string;
  orgName: string;
}> {
  const orgs = await getEventbriteOrganizations(accessToken);
  if (orgs.length > 0) {
    const first = orgs[0];
    return {
      orgId: first.id,
      orgName: typeof first.name === "string" ? first.name : (first.name as { text?: string })?.text ?? "Organization",
    };
  }
  const user = await getEventbriteUser(accessToken);
  return {
    orgId: user.id,
    orgName: user.name ?? "My Organization",
  };
}

/** Format UTC datetime for Eventbrite: YYYY-MM-DDThh:mm:ssZ (no milliseconds). */
function toEventbriteUtc(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const iso = d.toISOString();
  return iso.slice(0, 19) + "Z";
}

/** Create an event on Eventbrite. */
export async function createEventbriteEvent(
  token: string,
  orgId: string,
  params: {
    name: string;
    description?: string;
    startUtc: string;
    endUtc: string;
    timezone: string;
    currency?: string;
    onlineEvent?: boolean;
    venueName?: string;
    venueAddress?: string;
    imageUrl?: string;
  }
): Promise<EventbriteEvent> {
  const body: Record<string, unknown> = {
    event: {
      name: { html: params.name.replace(/</g, "&lt;") },
      start: {
        timezone: params.timezone,
        utc: toEventbriteUtc(params.startUtc),
      },
      end: {
        timezone: params.timezone,
        utc: toEventbriteUtc(params.endUtc),
      },
      currency: params.currency ?? "USD",
      online_event: params.onlineEvent ?? false,
    },
  };

  if (params.description) {
    (body.event as Record<string, unknown>).description = {
      html: params.description.replace(/</g, "&lt;"),
    };
  }

  if (params.imageUrl) {
    (body.event as Record<string, unknown>).logo_url = params.imageUrl;
  }

  const data = await eventbriteFetch<{ id: string }>(
    `/organizations/${orgId}/events/`,
    {
      method: "POST",
      body,
      token,
    }
  );

  return { id: data.id } as EventbriteEvent;
}

/** Create a ticket class (free or paid). */
export async function createEventbriteTicketClass(
  token: string,
  eventId: string,
  params: {
    name: string;
    free: boolean;
    quantityTotal: number;
    costCents?: number;
    currency?: string;
  }
): Promise<EventbriteTicketClass> {
  const ticketClass: Record<string, unknown> = {
    name: params.name,
    quantity_total: params.quantityTotal,
    free: params.free,
  };

  if (!params.free && params.costCents != null && params.costCents > 0) {
    ticketClass.cost = `${params.currency ?? "USD"},${params.costCents}`;
  }

  const data = await eventbriteFetch<{ id: string }>(
    `/events/${eventId}/ticket_classes/`,
    {
      method: "POST",
      body: { ticket_class: ticketClass },
      token,
    }
  );

  return { id: data.id } as EventbriteTicketClass;
}

/** Publish an event so registrations/tickets are available. */
export async function publishEventbriteEvent(
  token: string,
  eventId: string
): Promise<void> {
  await eventbriteFetch(`/events/${eventId}/publish/`, {
    method: "POST",
    token,
  });
}

/** Exchange OAuth code for access token. */
export async function exchangeEventbriteCode(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken?: string }> {
  const clientId = process.env.EVENTBRITE_CLIENT_ID;
  const clientSecret = process.env.EVENTBRITE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("EVENTBRITE_CLIENT_ID and EVENTBRITE_CLIENT_SECRET required");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch("https://www.eventbrite.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Eventbrite token exchange failed: ${errText}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}
