"use client";

import { MessageCircle } from "lucide-react";
import { api } from "@convex/_generated/api";
import { useQuery } from "@/hooks/use-live-query";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/** "Escríbele a Griselda por WhatsApp", using the number set in Ajustes. Hidden when there is none. */
export function WhatsAppContact({
  about,
  variant = "outline",
  size = "lg",
  className,
}: {
  /** What the message is about, e.g. an activity's title, to start the chat with context. */
  about?: string;
  variant?: "outline" | "default" | "link";
  size?: "sm" | "lg" | "default";
  className?: string;
}) {
  const { locale, dict } = useI18n();
  const settings = useQuery(api.settings.get);
  const t = dict.contact;
  const name = settings?.whatsappName;
  const greeting = about ? t.aboutText.replace("{about}", about) : t.text;
  const href = waLink(settings?.whatsapp, name ? `${t.hi.replace("{name}", name)} ${greeting}` : greeting);
  if (!href) return null;
  return (
    <Button asChild variant={variant} size={size} className={cn(variant === "link" && "h-auto p-0", className)}>
      <a href={href} target="_blank" rel="noreferrer" lang={locale}>
        <MessageCircle className="text-[#25D366]" /> {name ? t.withName.replace("{name}", name) : t.label}
      </a>
    </Button>
  );
}
