import { notFound } from "next/navigation";

/** Any unknown address shows the site's own 404, with the header and footer. */
export default function CatchAll() {
  notFound();
}
