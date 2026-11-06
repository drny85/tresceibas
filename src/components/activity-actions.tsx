"use client";

import { CalendarPlus, Download, Navigation } from "lucide-react";
import { useI18n, pick } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/share-buttons";
import { WhatsAppContact } from "@/components/whatsapp-contact";
import { googleCalendarUrl, icsFile, mapsUrl } from "@/lib/calendar";
import type { I18nText } from "@/components/admin/fields";

type Activity = {
  slug: string;
  title: I18nText;
  summary: I18nText;
  location: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
};

/** Add to calendar, directions, share and ask: everything a visitor does next. */
export function ActivityActions({ activity }: { activity: Activity }) {
  const { locale, dict } = useI18n();
  const t = dict.activities;
  const title = pick(activity.title, locale);
  const event = () => ({
    ...activity,
    title,
    details: pick(activity.summary, locale),
    url: window.location.href,
  });

  const downloadIcs = () => {
    const blob = new Blob([icsFile({ ...event(), uid: activity.slug })], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${activity.slug}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="grid gap-2">
        <p className="flex items-center gap-2 text-sm font-bold"><CalendarPlus className="size-4 text-brand-red" /> {t.addToCalendar}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(googleCalendarUrl(event()), "_blank", "noopener")}>Google Calendar</Button>
          <Button variant="outline" size="sm" onClick={downloadIcs}><Download /> {t.appleOutlook}</Button>
          <Button asChild variant="outline" size="sm">
            <a href={mapsUrl(activity.location)} target="_blank" rel="noreferrer"><Navigation /> {t.directions}</a>
          </Button>
        </div>
      </div>
      <div className="grid gap-2 border-t border-border pt-4">
        <p className="text-sm font-bold">{t.invite}</p>
        <ShareButtons text={`${title} · Tres Ceibas`} />
      </div>
      <div className="grid gap-1 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">{dict.contact.questions}</p>
        <WhatsAppContact about={title} variant="link" size="sm" className="w-fit font-semibold" />
      </div>
    </div>
  );
}
