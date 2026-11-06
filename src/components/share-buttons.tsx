"use client";

import { Link2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";

export function ShareButtons({ text }: { text: string }) {
  const { dict } = useI18n();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(dict.projects.copied);
    } catch {
      toast(window.location.href);
    }
  };
  const whatsapp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${text} ${window.location.href}`)}`;
    window.open(url, "_blank", "noopener");
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={whatsapp}>
        <MessageCircle /> WhatsApp
      </Button>
      <Button variant="outline" size="sm" onClick={copy}>
        <Link2 /> {dict.projects.copyLink}
      </Button>
    </div>
  );
}
