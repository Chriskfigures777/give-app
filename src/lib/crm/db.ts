/**
 * Typed CRM query helper.
 * The CRM tables (crm_*) are not yet in the generated Supabase types because
 * they're added via migration. This helper casts the client so TypeScript is
 * satisfied until `supabase gen types` is re-run after the migration.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

/** Returns a query builder for a CRM table (bypasses generated-type checking). */
export function crmFrom(supabase: SupabaseClient, table: string): AnyQuery {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}
