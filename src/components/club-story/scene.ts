/**
 * "Nuestro club" story animation, framework free so it can run in React or a plain page.
 *
 * The whole scene is a pure function of time: `seek(t)` draws the frame at t seconds.
 * Chapters: neighbors gather and talk, everyone donates, ground breaking,
 * building together, and the finished club with a celebration. A church sits on the far hill.
 */

const NS = "http://www.w3.org/2000/svg";
type Attrs = Record<string, string | number>;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}
const set = (e: Element, attrs: Attrs) => {
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = {
  inOut: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x: number) => 1 - Math.pow(1 - x, 3),
  back: (x: number) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  },
};
function track(t: number, keys: [number, number][], e = ease.inOut) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t < t1) return lerp(v0, v1, e(prog(t, t0, t1)));
  }
  return keys[keys.length - 1][1];
}
/** Visible between a and b with a pop in and a fade out. */
const pop = (t: number, a: number, b = Infinity, inDur = 0.35, outDur = 0.3) =>
  t < a || t > b ? 0 : Math.min(ease.back(prog(t, a, a + inDur)), b === Infinity ? 1 : 1 - prog(t, b - outDur, b));

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export const CHAPTERS = [0, 6, 11, 15.2, 25] as const;
export const DURATION = 34;

export function chapterAt(t: number) {
  let c = 0;
  CHAPTERS.forEach((start, i) => { if (t >= start) c = i; });
  return c;
}

// ---------------------------------------------------------------- people

type PersonSpec = { shirt: string; skin: string; hair: string; pants: string; s: number; long?: boolean };
const PEOPLE: PersonSpec[] = [
  { shirt: "#CE1126", skin: "#8D5524", hair: "#1d140e", pants: "#22304A", s: 1.04 },
  { shirt: "#F2B544", skin: "#C68642", hair: "#2b1a10", pants: "#3a4256", s: 0.94, long: true },
  { shirt: "#002D62", skin: "#5C3A1E", hair: "#121212", pants: "#5a4632", s: 1.02 },
  { shirt: "#2E7D4F", skin: "#E0AC69", hair: "#6b4a2b", pants: "#22304A", s: 0.92, long: true },
  { shirt: "#7B4FA0", skin: "#A86B3C", hair: "#1d140e", pants: "#2a2a2a", s: 1.0 },
  { shirt: "#E86F4A", skin: "#8D5524", hair: "#1d140e", pants: "#3a4256", s: 0.95, long: true },
  { shirt: "#1F8FB0", skin: "#C68642", hair: "#3b2716", pants: "#22304A", s: 1.03 },
  { shirt: "#FFFFFF", skin: "#5C3A1E", hair: "#bdbdbd", pants: "#5a4632", s: 0.9 },
];

const GATHER_X = PEOPLE.map((_, i) => 445 + i * 44);
const GATHER_Y = PEOPLE.map((_, i) => (i % 2 ? 478 : 490));

/** x/y keyframes per person across the story. */
function paths(i: number): { xs: [number, number][]; ys: [number, number][] } {
  const fromLeft = i < 4;
  const startX = fromLeft ? -50 - i * 70 : 1250 + (i - 4) * 70;
  const t0 = 0.2 + (fromLeft ? i : i - 4) * 0.4;
  const gx = GATHER_X[i], gy = GATHER_Y[i];
  const ground = [330, 370, 410, 0, 790, 830, 870, 910][i]; // chapter 3 places
  const build = [455, 600, 745, 230, 280, 330, 975, 1015][i]; // chapter 4
  const final = [400, 480, 560, 640, 720, 800, 960, 300][i]; // chapter 5
  const finalY = [540, 520, 560, 525, 550, 530, 492, 492][i];
  const xs: [number, number][] = [[t0, startX], [t0 + 3.2, gx], [11.2, gx]];
  const ys: [number, number][] = [[0, gy], [11.2, gy]];
  if (i === 0) { xs.push([12.8, 600]); ys.push([12.8, 494]); }
  else { xs.push([12.4, ground]); ys.push([12.4, gy]); }
  xs.push([15.2, i === 0 ? 600 : ground], [16.6, build]);
  ys.push([15.2, i === 0 ? 494 : gy], [16.6, i < 3 ? 500 : gy]);
  xs.push([25.2, build], [27.2, final]);
  ys.push([25.2, i < 3 ? 500 : gy], [27.2, finalY]);
  return { xs, ys };
}

type PersonParts = {
  root: SVGGElement; body: SVGGElement; legL: SVGLineElement; legR: SVGLineElement;
  armL: SVGLineElement; armR: SVGLineElement; hat: SVGGElement; shovel: SVGGElement;
  xs: [number, number][]; ys: [number, number][];
};

function buildPerson(p: PersonSpec, i: number, parent: Element): PersonParts {
  const root = el("g", {}, parent);
  el("ellipse", { cx: 0, cy: 1, rx: 14 * p.s, ry: 3.5, fill: "#000", opacity: 0.16 }, root);
  const body = el("g", {}, root);
  const legL = el("line", { x1: -4, y1: -20, x2: -4, y2: 0, stroke: p.pants, "stroke-width": 6, "stroke-linecap": "round" }, body);
  const legR = el("line", { x1: 4, y1: -20, x2: 4, y2: 0, stroke: p.pants, "stroke-width": 6, "stroke-linecap": "round" }, body);
  const armL = el("line", { x1: -9, y1: -41, x2: -9, y2: -24, stroke: p.skin, "stroke-width": 5, "stroke-linecap": "round" }, body);
  const armR = el("line", { x1: 9, y1: -41, x2: 9, y2: -24, stroke: p.skin, "stroke-width": 5, "stroke-linecap": "round" }, body);
  el("rect", { x: -10, y: -47, width: 20, height: 29, rx: 8, fill: p.shirt, stroke: "#22304A", "stroke-opacity": 0.2 }, body);
  el("rect", { x: -3, y: -51, width: 6, height: 6, fill: p.skin }, body);
  el("circle", { cx: 0, cy: -58, r: 9, fill: p.skin }, body);
  el("path", {
    d: p.long ? "M-10 -58 Q-10 -70 0 -70 Q10 -70 10 -58 L10 -46 Q7 -50 7 -58 Q0 -64 -7 -58 Q-7 -50 -10 -46 Z" : "M-9.5 -59 Q-9 -69 0 -69 Q9 -69 9.5 -59 Q4 -63 -9.5 -59 Z",
    fill: p.hair,
  }, body);
  el("circle", { cx: 3.5, cy: -58, r: 1.2, fill: "#1a1a1a" }, body);
  const hat = el("g", { opacity: 0 }, body);
  el("path", { d: "M-11 -62 Q-11 -74 0 -74 Q11 -74 11 -62 Z", fill: "#F2B544", stroke: "#b8861f", "stroke-width": 1 }, hat);
  el("rect", { x: -13, y: -63, width: 26, height: 3, rx: 1.5, fill: "#d99a22" }, hat);
  const shovel = el("g", { opacity: 0 }, body);
  el("line", { x1: 0, y1: 0, x2: 0, y2: 44, stroke: "#8A5A34", "stroke-width": 3.5, "stroke-linecap": "round" }, shovel);
  el("path", { d: "M-7 42 L7 42 L5 56 Q0 60 -5 56 Z", fill: "#9aa3ad", stroke: "#6c7580" }, shovel);
  const { xs, ys } = paths(i);
  return { root, body, legL, legR, armL, armR, hat, shovel, xs, ys };
}

// ---------------------------------------------------------------- scene

export type StoryOptions = {
  labels: { plot: string; club: string; clubTop: string };
  onTime?: (t: number) => void;
};

export function createClubStory(svg: SVGSVGElement, opts: StoryOptions) {
  svg.textContent = "";
  svg.setAttribute("viewBox", "0 0 1200 600");
  const defs = el("defs", {}, svg);
  const sky = el("linearGradient", { id: "cs-sky", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el("stop", { offset: 0, style: "stop-color:var(--sky-1,#8fd3f2)" }, sky);
  el("stop", { offset: 1, style: "stop-color:var(--sky-2,#fff3da)" }, sky);
  const haze = el("linearGradient", { id: "cs-haze", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el("stop", { offset: 0, style: "stop-color:var(--sky-2,#fff3da);stop-opacity:0" }, haze);
  el("stop", { offset: 1, style: "stop-color:var(--sky-2,#fff3da);stop-opacity:.55" }, haze);
  const jarClip = el("clipPath", { id: "cs-jar" }, defs);
  el("path", { d: "M562 246 Q556 250 556 262 L556 318 Q556 332 570 332 L630 332 Q644 332 644 318 L644 262 Q644 250 638 246 Z" }, jarClip);

  el("rect", { width: 1200, height: 600, fill: "url(#cs-sky)" }, svg);
  const sun = el("circle", { cx: 980, cy: 140, r: 52, style: "fill:var(--sun,#f2b544)" }, svg);
  const clouds = [0, 1, 2].map((k) => {
    const g = el("g", { style: "fill:var(--cloud,#fff)", opacity: 0.85 }, svg);
    el("ellipse", { cx: 0, cy: 0, rx: 62 - k * 8, ry: 15 }, g);
    el("ellipse", { cx: 26, cy: -12, rx: 32, ry: 15 }, g);
    el("ellipse", { cx: -24, cy: -6, rx: 24, ry: 11 }, g);
    return { g, base: [80, 620, 1050][k], y: [92, 150, 70][k], speed: [9, 6, 7.5][k] };
  });

  // far hill with the church
  el("path", { d: "M0 372 Q160 318 330 330 Q520 342 700 360 Q950 345 1200 362 V470 H0Z", style: "fill:var(--hill-far,#9ccaa6)" }, svg);
  const church = el("g", { opacity: 0.95 }, svg);
  el("rect", { x: 292, y: 318, width: 78, height: 36, fill: "#FBF7EF" }, church);
  el("polygon", { points: "288,320 331,298 374,320", fill: "#B23A3A" }, church);
  el("rect", { x: 300, y: 270, width: 22, height: 50, fill: "#FBF7EF" }, church);
  el("polygon", { points: "297,272 311,248 325,272", fill: "#B23A3A" }, church);
  el("path", { d: "M311 248 V232 M305 238 H317", stroke: "#8a6a3a", "stroke-width": 2.2, "stroke-linecap": "round" }, church);
  el("circle", { cx: 311, cy: 284, r: 4, fill: "#c9b48a" }, church);
  el("path", { d: "M326 354 V340 Q331 333 336 340 V354 Z", fill: "#7a5236" }, church);
  el("rect", { x: 346, y: 328, width: 8, height: 12, rx: 4, fill: "#9cc3d8" }, church);
  el("rect", { x: 304, y: 300, width: 6, height: 10, rx: 3, fill: "#9cc3d8" }, church);
  el("rect", { x: 312, y: 300, width: 6, height: 10, rx: 3, fill: "#9cc3d8" }, church);
  el("rect", { y: 300, width: 1200, height: 80, fill: "url(#cs-haze)" }, svg);

  el("path", { d: "M0 410 Q180 352 380 392 T800 380 T1200 395 V480 H0Z", style: "fill:var(--hill-1,#7fb98a)" }, svg);
  el("path", { d: "M0 446 Q260 400 520 436 T1200 428 V480 H0Z", style: "fill:var(--hill-2,#5e9f6e)" }, svg);
  el("rect", { y: 468, width: 1200, height: 132, style: "fill:var(--ground,#4f9a5e)" }, svg);
  el("rect", { y: 468, width: 1200, height: 5, style: "fill:var(--ground-2,#3f8650)" }, svg);

  const ceiba = (x: number, s: number, leaf: string) => {
    const g = el("g", { transform: `translate(${x},470) scale(${s})` }, svg);
    el("path", { d: "M-4.5,-62 L-3.5,-14 Q-5,-4 -15,0 L15,0 Q5,-4 3.5,-14 L4.5,-62 Z", fill: "#5A3A22" }, g);
    el("path", { d: "M0,-50 L-20,-66 M0,-50 L20,-66 M0,-58 L-8,-74 M0,-58 L8,-74", stroke: "#5A3A22", "stroke-width": 3, "stroke-linecap": "round", fill: "none" }, g);
    for (const [cx, cy, rx, ry] of [[0, -74, 38, 11], [-26, -70, 18, 8], [26, -70, 18, 8], [0, -85, 24, 10], [-15, -81, 16, 8], [15, -81, 16, 8]]) {
      el("ellipse", { cx, cy, rx, ry, fill: leaf }, g);
    }
  };
  ceiba(130, 1.9, "#2F7A4A");
  ceiba(1060, 1.35, "#3E9B5F");
  ceiba(1140, 2, "#2F7A4A");

  // court (ground decal, under everything that stands)
  const court = el("g", {}, svg);
  el("polygon", { points: "380,505 820,505 872,588 328,588", style: "fill:var(--court,#2b5f8e)" }, court);
  const courtLines = el("g", { stroke: "#fff", "stroke-width": 3, fill: "none" }, court);
  const courtPaths = [
    el("path", { d: "M392 512 H808 L856 582 H344 Z" }, courtLines),
    el("path", { d: "M600 512 V582" }, courtLines),
    el("ellipse", { cx: 600, cy: 547, rx: 44, ry: 13 }, courtLines),
    el("path", { d: "M368 530 Q430 547 372 566 M832 530 Q770 547 828 566" }, courtLines),
  ];
  courtPaths.forEach((p) => set(p, { "stroke-dasharray": 1200, "stroke-dashoffset": 1200 }));

  // plot stakes and rope
  const plot = el("g", {}, svg);
  const stakes = [440, 520, 680, 760].map((x) => el("path", { d: `M${x} 470 V440`, stroke: "#7A5332", "stroke-width": 5, "stroke-linecap": "round" }, plot));
  const rope = el("path", { d: "M440 446 Q480 452 520 446 Q600 454 680 446 Q720 452 760 446", stroke: "#E8D9B5", "stroke-width": 2.5, fill: "none", "stroke-dasharray": 360, "stroke-dashoffset": 360 }, plot);
  const mound = el("ellipse", { cx: 618, cy: 470, rx: 0, ry: 0, fill: "#7A5332" }, svg);

  // building
  const slab = el("g", {}, svg);
  el("rect", { x: 425, y: 462, width: 350, height: 12, rx: 2, fill: "#A7A39A" }, slab);
  el("rect", { x: 425, y: 462, width: 350, height: 3, fill: "#C9C5BB" }, slab);
  const rows: SVGGElement[] = [];
  const ROWS = 9, ROW_H = 134 / ROWS;
  for (let k = 0; k < ROWS; k++) {
    const y = 464 - (k + 1) * ROW_H;
    const g = el("g", {}, svg);
    el("rect", { x: 440, y, width: 320, height: ROW_H + 0.6, style: "fill:var(--wall,#f4e4c6)" }, g);
    let d = `M440 ${y + ROW_H} H760`;
    for (let x = 440 + (k % 2 ? 20 : 40); x < 760; x += 40) d += ` M${x} ${y} V${y + ROW_H}`;
    el("path", { d, stroke: "#d6c29d", "stroke-width": 1 }, g);
    rows.push(g);
  }
  const openings = el("g", {}, svg);
  const windows = [
    el("rect", { x: 465, y: 392, width: 62, height: 46, rx: 3, class: "cs-win" }, openings),
    el("rect", { x: 673, y: 392, width: 62, height: 46, rx: 3, class: "cs-win" }, openings),
  ];
  el("path", { d: "M465 415 H527 M496 392 V438 M673 415 H735 M704 392 V438", stroke: "#fff", "stroke-width": 3 }, openings);
  el("rect", { x: 574, y: 396, width: 52, height: 68, rx: 3, fill: "#8A5A34" }, openings);
  el("circle", { cx: 616, cy: 432, r: 3, fill: "#F2B544" }, openings);

  const roof = el("g", {}, svg);
  el("polygon", { points: "418,334 600,262 782,334", fill: "#CE1126" }, roof);
  el("rect", { x: 418, y: 332, width: 364, height: 9, fill: "#9E0D1D" }, roof);
  const sign = el("g", { opacity: 0 }, roof);
  const signTop = el("text", { x: 600, y: 302, "text-anchor": "middle", "font-weight": 800, "font-size": 11, "letter-spacing": 2, fill: "#fff", "font-family": "var(--font-bricolage), system-ui, sans-serif" }, sign);
  signTop.textContent = opts.labels.clubTop;
  const signMain = el("text", { x: 600, y: 324, "text-anchor": "middle", "font-weight": 800, "font-size": 21, fill: "#fff", "font-family": "var(--font-bricolage), system-ui, sans-serif" }, sign);
  signMain.textContent = opts.labels.club;

  // crane
  const crane = el("g", {}, svg);
  const mast = el("g", {}, crane);
  let lattice = "M872 470 V196 M888 470 V196";
  for (let y = 470; y > 200; y -= 22) lattice += ` M872 ${y} L888 ${y - 22}`;
  el("path", { d: lattice, stroke: "#E0A21B", "stroke-width": 3, fill: "none" }, mast);
  el("rect", { x: 862, y: 462, width: 36, height: 10, fill: "#5B6577" }, mast);
  const jib = el("g", {}, crane);
  el("path", { d: "M940 196 H560 M940 206 H560 M880 184 L560 200 M880 184 L940 196", stroke: "#E0A21B", "stroke-width": 3, fill: "none" }, jib);
  el("rect", { x: 870, y: 180, width: 22, height: 26, rx: 3, fill: "#5B6577" }, jib);
  el("rect", { x: 920, y: 204, width: 24, height: 18, fill: "#6c7580" }, jib);
  const cable = el("line", { x1: 600, y1: 206, x2: 600, y2: 230, stroke: "#3b4250", "stroke-width": 1.6 }, crane);
  const hook = el("path", { d: "M594 0 H606 L606 6 Q606 14 600 14 Q595 14 595 10", stroke: "#3b4250", "stroke-width": 2.4, fill: "none" }, crane);

  // playground and flag
  const swing = el("g", {}, svg);
  el("path", { d: "M215 470 L237 392 L259 470 M295 470 L317 392 L339 470 M237 394 H317", stroke: "#002D62", "stroke-width": 5, fill: "none", "stroke-linecap": "round" }, swing);
  el("path", { d: "M259 394 V440 M279 394 V440 M287 394 V446 M307 394 V446", stroke: "#5B6577", "stroke-width": 2 }, swing);
  el("rect", { x: 255, y: 438, width: 28, height: 6, rx: 2, fill: "#F2B544" }, swing);
  el("rect", { x: 283, y: 444, width: 28, height: 6, rx: 2, fill: "#CE1126" }, swing);
  const hoops = el("g", {}, svg);
  el("path", { d: "M352 548 V470 H372 M848 548 V470 H828", stroke: "#5B6577", "stroke-width": 5, fill: "none" }, hoops);
  el("rect", { x: 370, y: 452, width: 8, height: 34, fill: "#fff", stroke: "#5B6577", "stroke-width": 2 }, hoops);
  el("rect", { x: 822, y: 452, width: 8, height: 34, fill: "#fff", stroke: "#5B6577", "stroke-width": 2 }, hoops);
  const pole = el("g", {}, svg);
  el("path", { d: "M800 470 V270", stroke: "#5B6577", "stroke-width": 4 }, pole);
  el("circle", { cx: 800, cy: 268, r: 4, fill: "#F2B544" }, pole);
  const flag = el("g", {}, pole);
  for (const [x, y, c] of [[802, 274, "#002D62"], [832, 274, "#CE1126"], [802, 294, "#CE1126"], [832, 294, "#002D62"]] as const) {
    el("rect", { x, y, width: 30, height: 20, fill: c }, flag);
  }
  el("rect", { x: 829, y: 274, width: 6, height: 40, fill: "#fff" }, flag);
  el("rect", { x: 802, y: 291, width: 60, height: 6, fill: "#fff" }, flag);

  const bunting = el("g", {}, svg);
  el("path", { d: "M440 344 Q620 370 800 300", stroke: "#5B6577", "stroke-width": 1.5, fill: "none" }, bunting);
  const flags: SVGPolygonElement[] = [];
  for (let i = 1; i < 18; i++) {
    const t = i / 18, x = (1 - t) ** 2 * 440 + 2 * (1 - t) * t * 620 + t * t * 800, y = (1 - t) ** 2 * 344 + 2 * (1 - t) * t * 370 + t * t * 300;
    flags.push(el("polygon", { points: `${x - 7},${y} ${x + 7},${y} ${x},${y + 14}`, fill: ["#CE1126", "#FFFFFF", "#002D62", "#F2B544"][i % 4] }, bunting));
  }

  // people
  const peopleLayer = el("g", {}, svg);
  const people = PEOPLE.map((p, i) => buildPerson(p, i, peopleLayer));

  // dirt particles
  const r = rng(7);
  const dirt = [13.3, 13.85, 14.4].flatMap((t0) =>
    Array.from({ length: 9 }, () => ({ t0, vx: (r() - 0.3) * 160, vy: -90 - r() * 120, e: el("circle", { r: 2 + r() * 3, fill: "#7A5332", opacity: 0 }, svg) })),
  );

  // donation jar and coins
  const jar = el("g", {}, svg);
  const jarFill = el("rect", { x: 550, y: 332, width: 100, height: 0, fill: "#2E7D4F", "clip-path": "url(#cs-jar)", opacity: 0.85 }, jar);
  el("path", { d: "M562 246 Q556 250 556 262 L556 318 Q556 332 570 332 L630 332 Q644 332 644 318 L644 262 Q644 250 638 246 Z", fill: "#ffffff", "fill-opacity": 0.25, stroke: "#ffffff", "stroke-width": 3 }, jar);
  el("rect", { x: 558, y: 236, width: 84, height: 12, rx: 4, fill: "#8A5A34" }, jar);
  el("path", { d: "M600 300 C592 290 580 296 584 306 C587 313 600 320 600 320 C600 320 613 313 616 306 C620 296 608 290 600 300 Z", fill: "#CE1126" }, jar);
  const coins = people.map(() => {
    const g = el("g", { opacity: 0 }, svg);
    el("circle", { r: 9, fill: "#F2B544", stroke: "#b8861f", "stroke-width": 2 }, g);
    const s = el("text", { y: 4, "text-anchor": "middle", "font-size": 11, "font-weight": 800, fill: "#8a5f10", "font-family": "system-ui, sans-serif" }, g);
    s.textContent = "$";
    return g;
  });

  // speech bubbles
  const bubble = (icon: (g: SVGGElement) => void) => {
    const g = el("g", { opacity: 0 }, svg);
    el("path", { d: "M-24 -22 H24 Q30 -22 30 -16 V4 Q30 10 24 10 H6 L0 18 L-6 10 H-24 Q-30 10 -30 4 V-16 Q-30 -22 -24 -22 Z", fill: "#fff", stroke: "#22304A", "stroke-opacity": 0.2 }, g);
    icon(el("g", {}, g));
    return g;
  };
  const dots: SVGCircleElement[] = [];
  const BUBBLES = [
    { who: 1, t0: 2.6, t1: 4.6, g: bubble((g) => { for (const x of [-11, 0, 11]) dots.push(el("circle", { cx: x, cy: -6, r: 3.5, fill: "#5B6577" }, g)); }) },
    { who: 5, t0: 3.2, t1: 5.2, g: bubble((g) => el("path", { d: "M0 -1 C-7 -10 -17 -4 -12 4 C-9 8 0 12 0 12 C0 12 9 8 12 4 C17 -4 7 -10 0 -1 Z", transform: "translate(0,-8) scale(.8)", fill: "#CE1126" }, g)) },
    { who: 3, t0: 3.9, t1: 5.9, g: bubble((g) => { el("polygon", { points: "-14,-6 0,-17 14,-6", fill: "#CE1126" }, g); el("rect", { x: -10, y: -6, width: 20, height: 12, fill: "#F2B544" }, g); el("rect", { x: -3, y: -1, width: 6, height: 7, fill: "#8A5A34" }, g); }) },
    { who: 6, t0: 4.5, t1: 6.2, g: bubble((g) => { el("circle", { cx: 0, cy: -6, r: 10, fill: "#E8772E" }, g); el("path", { d: "M-10 -6 H10 M0 -16 V4 M-7 -13 Q0 -6 -7 1 M7 -13 Q0 -6 7 1", stroke: "#8A3E12", "stroke-width": 1.4, fill: "none" }, g); }) },
    { who: 2, t0: 5.0, t1: 6.6, g: bubble((g) => { el("path", { d: "M-8 -2 V-12 Q-8 -16 -4 -16 L-2 -8 H8 Q11 -8 10 -4 L8 4 Q7 6 4 6 H-8 Z", fill: "#2E7D4F" }, g); el("rect", { x: -14, y: -10, width: 5, height: 16, rx: 1.5, fill: "#2E7D4F" }, g); }) },
  ];

  // confetti
  const r2 = rng(42);
  const confetti = Array.from({ length: 70 }, () => ({
    x: r2() * 1200, delay: r2() * 2.6, speed: 90 + r2() * 120, sway: 10 + r2() * 30, rot: r2() * 360,
    e: el("rect", { width: 7, height: 11, rx: 1.5, fill: ["#CE1126", "#002D62", "#F2B544", "#2E7D4F", "#ffffff"][Math.floor(r2() * 5)], opacity: 0 }, svg),
  }));

  // ---------------------------------------------------------------- draw a frame
  function seek(t: number) {
    t = clamp(t, 0, DURATION);
    set(sun, { cy: lerp(150, 118, t / DURATION) });
    for (const c of clouds) {
      const x = ((c.base + t * c.speed * 3) % 1500) - 150;
      set(c.g, { transform: `translate(${x},${c.y})` });
    }

    // plot
    const stakeIn = t >= 11.5 && t < 16.6;
    stakes.forEach((s, k) => set(s, { opacity: stakeIn ? ease.back(prog(t, 11.5 + k * 0.15, 11.85 + k * 0.15)) : 0 }));
    set(rope, { "stroke-dashoffset": 360 * (1 - prog(t, 12.0, 12.8)), opacity: stakeIn ? 1 : 0 });
    const m = t < 13.3 ? 0 : t < 16.4 ? ease.out(prog(t, 13.3, 14.8)) : 1 - prog(t, 16.4, 16.8);
    set(mound, { rx: 18 * m, ry: 6 * m });

    // building
    set(slab, { opacity: prog(t, 16.4, 16.9), transform: `translate(0,${(1 - ease.out(prog(t, 16.4, 17.1))) * 20})` });
    rows.forEach((g, k) => {
      const a = 17.2 + k * 0.38, p = ease.out(prog(t, a, a + 0.35));
      set(g, { opacity: p, transform: `translate(0,${(1 - p) * -10})` });
    });
    const op = ease.back(prog(t, 20.6, 21.3));
    set(openings, { opacity: prog(t, 20.6, 20.9), transform: `translate(600,430) scale(${op}) translate(-600,-430)` });
    const roofDy = t < 21.4 ? -400 : track(t, [[21.4, -170], [23.2, 0]], ease.inOut);
    set(roof, { opacity: t < 21.4 ? 0 : 1, transform: `translate(0,${roofDy})` });
    set(sign, { opacity: prog(t, 23.4, 24) });
    windows.forEach((w) => set(w, { style: t > 27 ? "fill:var(--glow,#ffd27a)" : "fill:var(--glass,#bfe3f5)" }));

    // crane
    const mastP = t < 24.4 ? ease.out(prog(t, 15.2, 16.4)) : 1 - ease.inOut(prog(t, 24.4, 25.2));
    const jibP = t < 24 ? ease.out(prog(t, 16, 16.8)) : 1 - ease.inOut(prog(t, 24, 24.6));
    set(mast, { transform: `translate(0,470) scale(1,${mastP}) translate(0,-470)` });
    set(jib, { transform: `translate(880,${196 + (1 - mastP) * 274}) scale(${jibP},1) translate(-880,-196)`, opacity: mastP > 0.05 ? 1 : 0 });
    const hookY = t < 21.4 ? lerp(230, 262 - 170 - 14, prog(t, 17, 21.4)) : t < 23.3 ? 262 + roofDy - 14 : lerp(248, 226, prog(t, 23.3, 24));
    const craneVis = jibP > 0.98 ? 1 : 0;
    set(cable, { y2: hookY, opacity: craneVis });
    set(hook, { transform: `translate(0,${hookY})`, opacity: craneVis });

    // celebration pieces
    courtPaths.forEach((p) => set(p, { "stroke-dashoffset": 1200 * (1 - ease.inOut(prog(t, 25.4, 26.8))) }));
    set(court, { opacity: prog(t, 25.0, 25.5) });
    set(swing, { opacity: prog(t, 25.6, 25.9), transform: `translate(277,470) scale(${ease.back(prog(t, 25.6, 26.1))}) translate(-277,-470)` });
    set(hoops, { opacity: prog(t, 25.9, 26.3) });
    set(pole, { opacity: prog(t, 25.8, 26.1) });
    const wave = Math.sin(t * 5) * 3;
    set(flag, { transform: `translate(0,${(1 - ease.inOut(prog(t, 26.2, 27.6))) * 150}) translate(802,284) skewY(${wave}) translate(-802,-284)` });
    flags.forEach((f, k) => set(f, { opacity: prog(t, 27 + k * 0.05, 27.2 + k * 0.05) }));
    set(bunting, { opacity: t >= 27 ? 1 : 0 });

    // jar and coins
    const jarS = pop(t, 6.0, 11.0, 0.45, 0.4);
    set(jar, { opacity: clamp(jarS * 1.2), transform: `translate(600,332) scale(${jarS}) translate(-600,-332)` });
    let landed = 0;
    people.forEach((pp, i) => {
      const tl = 6.6 + i * 0.45, land = tl + 0.9;
      const x0 = track(t, pp.xs), y0 = track(t, pp.ys) - 70 * PEOPLE[i].s;
      const p = prog(t, tl, land);
      const visible = t >= tl && t < land;
      const cx = lerp(x0, 600, p), cy = (1 - p) ** 2 * y0 + 2 * (1 - p) * p * 170 + p * p * 240;
      set(coins[i], { opacity: visible ? 1 : 0, transform: `translate(${cx},${cy}) rotate(${p * 540})` });
      if (t >= land) landed += 1 - 0;
    });
    const level = clamp(landed / people.length + (landed < people.length ? 0 : 0));
    const lvl = 86 * ease.out(level);
    set(jarFill, { y: 332 - lvl, height: lvl });

    // bubbles
    for (const b of BUBBLES) {
      const s = pop(t, b.t0, b.t1);
      const pp = people[b.who];
      const x = track(t, pp.xs), y = track(t, pp.ys) - 96 * PEOPLE[b.who].s;
      set(b.g, { opacity: s > 0 ? 1 : 0, transform: `translate(${x},${y}) scale(${s})` });
    }
    dots.forEach((d, k) => set(d, { cy: -6 - Math.max(0, Math.sin(t * 8 - k)) * 3 }));

    // dirt
    for (const d of dirt) {
      const dt = t - d.t0;
      if (dt < 0 || dt > 0.8) { set(d.e, { opacity: 0 }); continue; }
      set(d.e, { opacity: 1 - dt / 0.8, cx: 618 + d.vx * dt, cy: 470 + d.vy * dt + 300 * dt * dt });
    }

    // confetti
    for (const c of confetti) {
      const dt = t - 28 - c.delay;
      if (dt < 0) { set(c.e, { opacity: 0 }); continue; }
      const y = -20 + dt * c.speed;
      set(c.e, {
        opacity: y > 600 ? 0 : 1,
        transform: `translate(${c.x + Math.sin(dt * 3 + c.rot) * c.sway},${y}) rotate(${c.rot + dt * 220})`,
      });
    }

    // people
    const celebrate = prog(t, 27.4, 27.8) * (1 - prog(t, 33, 34));
    people.forEach((pp, i) => {
      const x = track(t, pp.xs), y = track(t, pp.ys);
      const dx = x - track(Math.max(0, t - 0.06), pp.xs);
      const walking = Math.abs(dx) > 0.2;
      const toCenter = x < 600 ? 1 : -1;
      const facing = walking ? Math.sign(dx) : i === 0 && t > 12.8 && t < 15.2 ? 1 : toCenter;
      const swingA = walking ? Math.sin(t * 15 + i) * 24 : 0;
      // giving a coin, cheering, working
      const give = 1 - Math.min(1, Math.abs(t - (6.6 + i * 0.45)) / 0.35);
      const cheerGround = i !== 0 && t > 14.6 && t < 15.4 ? Math.sin(prog(t, 14.6, 15.4) * Math.PI) : 0;
      const working = i < 3 && t > 17 && t < 21.4;
      const hammer = working ? Math.max(0, Math.sin((t - 17) * 9 + i * 2)) : 0;
      const up = Math.max(give * 0.8, cheerGround, celebrate);
      const hop = Math.max(give * 6, celebrate * Math.abs(Math.sin((t - 27.4) * 6 + i * 1.3)) * 12, hammer * 2);
      const jiggle = working ? Math.sin((t - 17) * 2.2 + i * 1.7) * 10 : 0;
      const s = PEOPLE[i].s;
      set(pp.root, { transform: `translate(${x + jiggle},${y})` });
      set(pp.body, { transform: `translate(0,${-hop}) scale(${s * facing},${s})` });
      set(pp.legL, { transform: `rotate(${swingA},-4,-20)` });
      set(pp.legR, { transform: `rotate(${-swingA},4,-20)` });
      const talk = BUBBLES.some((b) => b.who === i && t > b.t0 && t < b.t1) ? Math.max(0, Math.sin(t * 6)) * 40 : 0;
      set(pp.armL, { transform: `rotate(${12 + up * 150},-9,-41)` });
      set(pp.armR, { transform: `rotate(${-12 - Math.max(up * 150, talk, hammer * 110)},9,-41)` });
      set(pp.hat, { opacity: i < 3 && t > 15 && t < 25.4 ? 1 : 0, transform: `translate(0,${i < 3 ? (1 - ease.out(prog(t, 15, 15.5))) * -30 : 0})` });
      const holding = i === 0 && t > 11.4 && t < 15.2;
      const dig = t > 13 && t < 14.7 ? Math.max(0, Math.sin((t - 13) * Math.PI * 1.8)) : 0;
      set(pp.shovel, { opacity: holding ? 1 : 0, transform: `translate(12,-40) rotate(${-28 + dig * 38})` });
    });

    opts.onTime?.(t);
  }

  // ---------------------------------------------------------------- playback
  let raf = 0, playing = false, start = 0, current = 0;
  const loop = (now: number) => {
    current = Math.min(DURATION, (now - start) / 1000);
    seek(current);
    if (current >= DURATION) { playing = false; return; }
    raf = requestAnimationFrame(loop);
  };
  const play = (from = current >= DURATION ? 0 : current) => {
    cancelAnimationFrame(raf);
    playing = true;
    start = performance.now() - from * 1000;
    raf = requestAnimationFrame(loop);
  };
  const pause = () => { cancelAnimationFrame(raf); playing = false; };
  const goTo = (t: number) => { current = clamp(t, 0, DURATION); seek(current); if (playing) play(current); };

  seek(0);
  return {
    play, pause, seek: goTo,
    get playing() { return playing; },
    get time() { return current; },
    destroy: () => cancelAnimationFrame(raf),
  };
}

export type ClubStory = ReturnType<typeof createClubStory>;
