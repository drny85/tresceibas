"use client";

import { useSyncExternalStore } from "react";
import { Link2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { waShare } from "@/lib/whatsapp";

const canShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/** WhatsApp first (that is how the community shares), then the phone's own share sheet, then copy. */
export function ShareButtons({ text, url }: { text: string; url?: string }) {
  const { dict } = useI18n();
  const nativeShare = useSyncExternalStore(() => () => {}, canShare, () => false);
  const link = () => url ?? window.location.href;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link());
      toast.success(dict.projects.copied);
    } catch {
      toast(link());
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: "Tres Ceibas", text, url: link() });
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        className="border-[#25D366]/50 hover:bg-[#25D366]/10"
        onClick={() => window.open(waShare(`${text} ${link()}`), "_blank", "noopener")}
      >
        <MessageCircle className="text-[#25D366]" /> WhatsApp
      </Button>
      {nativeShare && (
        <Button variant="outline" size="sm" onClick={share}>
          <Share2 /> {dict.common.share}
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={copy}>
        <Link2 /> {dict.projects.copyLink}
      </Button>
    </div>
  );
}
