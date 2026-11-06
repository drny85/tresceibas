/**
 * A wa.me link for a phone number as people type it. Dominican numbers
 * (809, 829, 849) without the country code get the +1 that WhatsApp needs.
 */
export function waLink(phone: string | null | undefined, text?: string) {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 10 && /^8[024]9/.test(digits)) digits = `1${digits}`;
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Share a text and link through WhatsApp, letting the person pick the chat. */
export function waShare(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
