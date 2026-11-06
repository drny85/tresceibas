import { cn } from "@/lib/utils";

/** Shown until real photos are uploaded from the admin panel. */
export function PlaceholderImage({ label, className, tone = 0 }: { label?: string; className?: string; tone?: number }) {
  const tones = [
    "from-[#cfe8f6] to-[#f8ecd2] dark:from-[#1b3558] dark:to-[#4a3a3a]",
    "from-[#d9efdf] to-[#f6e7c8] dark:from-[#1f3d33] dark:to-[#43402f]",
    "from-[#f6dcd9] to-[#f3ead6] dark:from-[#3f2630] dark:to-[#3b3a33]",
  ];
  return (
    <div
      className={cn("relative flex aspect-[16/10] items-end overflow-hidden bg-gradient-to-br", tones[tone % tones.length], className)}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 320 200" className="absolute inset-x-0 bottom-0 h-3/4 w-full" aria-hidden preserveAspectRatio="xMidYMax slice">
        <path d="M0 150 Q80 120 160 140 T320 135 V200 H0Z" className="fill-[#7fb98a] dark:fill-[#2f5a48]" />
        <rect y="160" width="320" height="40" className="fill-[#4f9a5e] dark:fill-[#2c5e3f]" />
        {[70, 160, 250].map((x, i) => (
          <g key={x} transform={`translate(${x},162) scale(${i === 1 ? 1.1 : 0.85})`}>
            <path d="M-3,-50 L-2.5,-10 Q-3,-3 -10,0 L10,0 Q3,-3 2.5,-10 L3,-50 Z" fill="#5A3A22" />
            <ellipse cx="0" cy="-58" rx="30" ry="9" className="fill-[#2f7a4a] dark:fill-[#3e9b5f]" />
            <ellipse cx="0" cy="-67" rx="19" ry="8" className="fill-[#2f7a4a] dark:fill-[#3e9b5f]" />
          </g>
        ))}
      </svg>
      {label && (
        <span className="relative m-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
          {label}
        </span>
      )}
    </div>
  );
}
