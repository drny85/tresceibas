import { connection } from "next/server";

/**
 * Marks a page as rendered per request, so its title and link preview
 * (which read the address) can stream in while the rest is prefetched.
 * Place inside <Suspense>.
 */
export async function RequestTime() {
  await connection();
  return null;
}
