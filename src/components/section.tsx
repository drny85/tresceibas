import { cn } from "@/lib/utils";

export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl pr-[max(1rem,env(safe-area-inset-right,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))]", className)} {...props} />;
}

export function PageHeader({ title, lead, eyebrow }: { title: string; lead?: string; eyebrow?: string }) {
  return (
    <Container className="grid gap-3 pt-8 pb-6 sm:pt-14 sm:pb-8">
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-red">{eyebrow}</p>}
      <h1 className="text-[2.15rem] leading-[1.05] font-extrabold text-balance tracking-tight sm:text-5xl">{title}</h1>
      {lead && <p className="max-w-2xl text-base text-muted-foreground sm:text-lg text-pretty">{lead}</p>}
    </Container>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{children}</h2>
      {action}
    </div>
  );
}
