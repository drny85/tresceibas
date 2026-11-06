"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type I18nText = { es: string; en: string };
export const emptyText = (): I18nText => ({ es: "", en: "" });

export function errorText(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  // Convex wraps server errors: "[CONVEX M(...)] Uncaught Error: <message> at handler"
  const m = msg.match(/Uncaught Error: (.*?)(?:\n|\s+at |$)/);
  return m ? m[1] : msg;
}

export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Spanish and English side by side. */
export function BilingualField({
  id,
  label,
  value,
  onChange,
  multiline = false,
}: {
  id: string;
  label: string;
  value: I18nText;
  onChange: (v: I18nText) => void;
  multiline?: boolean;
}) {
  const Comp = multiline ? Textarea : Input;
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      <div className="grid gap-2 md:grid-cols-2">
        {(["es", "en"] as const).map((l) => (
          <div key={l} className="relative">
            <span className="pointer-events-none absolute top-2 right-2 rounded bg-muted px-1.5 text-[10px] font-bold uppercase text-muted-foreground">{l}</span>
            <Comp
              id={`${id}-${l}`}
              aria-label={`${label} (${l === "es" ? "español" : "inglés"})`}
              value={value[l]}
              onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => onChange({ ...value, [l]: e.target.value })}
              className={multiline ? "min-h-32 pr-10" : "pr-10"}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
        className,
      )}
      {...props}
    />
  );
}

export function ImageUpload({
  value,
  previewUrl,
  onChange,
}: {
  value?: Id<"_storage">;
  previewUrl?: string | null;
  onChange: (id: Id<"_storage"> | undefined) => void;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Elige una imagen (JPG, PNG o WebP).");
    if (file.size > 8 * 1024 * 1024) return toast.error("La imagen debe pesar menos de 8 MB.");
    setBusy(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      setLocalPreview(URL.createObjectURL(file));
      onChange(storageId);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const shown = localPreview ?? (value ? previewUrl : null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="" className="h-20 w-32 rounded-lg border border-border object-cover" />
      ) : (
        <div className="grid h-20 w-32 place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">Sin foto</div>
      )}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} {value ? "Cambiar foto" : "Subir foto"}
      </Button>
      {value && (
        <Button type="button" variant="ghost" size="sm" onClick={() => { setLocalPreview(null); onChange(undefined); }}>
          <Trash2 /> Quitar
        </Button>
      )}
    </div>
  );
}

/** Turns "2,000,000" or "2000000" into a number. */
export function parseMoney(s: string) {
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
