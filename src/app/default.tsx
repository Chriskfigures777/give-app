/**
 * Default fallback for the root segment. Prevents "No default component was found
 * for a parallel route" warning when Next.js falls back to the NotFound boundary.
 */
export default function Default() {
  return null;
}
