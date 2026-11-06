"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAPTERS, DURATION, chapterAt, createClubStory, type ClubStory as Story } from "./scene";

/**
 * The animated story of the club: neighbors gather and talk, donate,
 * break ground, build together and celebrate. Plays when it scrolls into view.
 */
export function ClubStory({ className }: { className?: string }) {
  const { dict } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const scrubRef = useRef<HTMLInputElement>(null);
  const storyRef = useRef<Story | null>(null);
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let lastChapter = -1;
    // onTime runs once during creation, before `story` is assigned.
    let created: Story | null = null;
    const story = createClubStory(svg, {
      labels: { plot: "", club: "TRES CEIBAS", clubTop: dict.home.clubTop },
      onTime: (t) => {
        if (scrubRef.current) scrubRef.current.value = String(t);
        const c = chapterAt(t);
        if (c !== lastChapter) { lastChapter = c; setChapter(c); }
        setEnded(t >= DURATION);
        setPlaying(Boolean(created?.playing) && t < DURATION);
      },
    });
    created = story;
    storyRef.current = story;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      story.seek(DURATION);
      return () => story.destroy();
    }
    let started = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) { started = true; story.play(0); setPlaying(true); }
        else if (!entry.isIntersecting && story.playing) { story.pause(); setPlaying(false); }
        else if (entry.isIntersecting && started && !story.playing && story.time < DURATION) { story.play(); setPlaying(true); }
      },
      { threshold: 0.35 },
    );
    io.observe(svg);
    return () => { io.disconnect(); story.destroy(); };
  }, [dict.home.clubTop]);

  const toggle = () => {
    const s = storyRef.current;
    if (!s) return;
    if (s.playing) { s.pause(); setPlaying(false); }
    else { s.play(); setPlaying(true); }
  };

  return (
    <figure className={cn("grid gap-3", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[var(--sky-2)] shadow-sm">
        <svg ref={svgRef} role="img" aria-label={dict.home.storyChapters[chapter]} className="block aspect-[2/1] h-auto w-full" />
        <p
          key={chapter}
          className="pointer-events-none absolute top-2 left-2 max-w-[85%] rounded-full bg-background/85 px-2.5 py-1 font-display text-xs sm:top-3 sm:left-3 sm:px-3 sm:py-1.5 sm:text-sm font-bold text-foreground shadow-sm backdrop-blur animate-in fade-in slide-in-from-top-1 duration-500 md:text-base"
          aria-live="polite"
        >
          {dict.home.storyChapters[chapter]}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="size-11 shrink-0 sm:size-10" onClick={ended ? () => { storyRef.current?.play(0); setPlaying(true); } : toggle} aria-label={ended ? dict.home.replay : playing ? dict.home.pause : dict.home.play}>
          {ended ? <RotateCcw /> : playing ? <Pause /> : <Play />}
        </Button>
        <div className="relative min-w-0 flex-1">
          <input
            ref={scrubRef}
            type="range"
            min={0}
            max={DURATION}
            step={0.05}
            defaultValue={0}
            aria-label={dict.home.timeline}
            className="club-story-scrub h-11 w-full cursor-pointer touch-pan-y sm:h-6"
            onInput={(e) => storyRef.current?.seek(Number((e.target as HTMLInputElement).value))}
          />
          <div className="pointer-events-none absolute inset-x-0 top-[calc(50%+6px)] h-1.5" aria-hidden>
            {CHAPTERS.slice(1).map((c) => (
              <span key={c} className="absolute top-0 h-1.5 w-px bg-muted-foreground/50" style={{ left: `${(c / DURATION) * 100}%` }} />
            ))}
          </div>
        </div>
      </div>
      <figcaption className="text-sm text-muted-foreground">{dict.home.illustrationCaption}</figcaption>
    </figure>
  );
}
