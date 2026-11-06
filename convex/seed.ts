import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Infer } from "convex/values";
import type { activityCategory } from "./schema";
import { parseLegacyTime } from "./lib/time";

const t = (es: string, en: string) => ({ es, en });

/**
 * Loads the first project, activity and committee from the
 * "Proyecto Tres Ceiberos Ausente" document. Run once:
 *   npx convex run seed:run
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (await ctx.db.query("projects").first()) return "Ya hay datos; no se cargó nada.";

    await ctx.db.insert("settings", { key: "main", usdToDop: 60 });

    const land = await ctx.db.insert("projects", {
      slug: "terreno-club",
      title: t("Terreno para el club comunitario", "Land for the community club"),
      summary: t(
        "Compremos juntos el terreno donde se levantará el Club Comunitario Tres Ceibas.",
        "Let's buy the land together where the Tres Ceibas Community Club will stand.",
      ),
      description: t(
        "Tres Ceibas no tiene un espacio propio para la recreación, el deporte y la cultura. Con este terreno tendremos un lugar para torneos, actividades de la iglesia, ferias y para que nuestros jóvenes crezcan en un ambiente sano. Cada aporte, desde aquí o desde el exterior, nos acerca a la meta.",
        "Tres Ceibas has no place of its own for recreation, sports and culture. With this land we will have a place for tournaments, church activities, fairs, and for our young people to grow up in a healthy environment. Every gift, from here or from abroad, brings us closer to the goal.",
      ),
      goalDop: 2_000_000,
      uses: [
        { label: t("Compra del terreno", "Purchase of the land"), amountDop: 1_859_100 },
        {
          label: t("Organización del evento Tres Ceiberos Ausente", "Organizing the Tres Ceiberos Ausente event"),
          amountDop: 140_900,
        },
      ],
      status: "active",
      featured: true,
      order: 1,
    });

    await ctx.db.insert("activities", {
      slug: "tres-ceiberos-ausente-2027",
      title: t("Tres Ceiberos Ausente 2027", "Tres Ceiberos Ausente 2027"),
      summary: t(
        "Tres días de cultura, fe y deporte para recibir a los ceiberos que viven fuera y recaudar para el terreno del club.",
        "Three days of culture, faith and sports to welcome home the people of Tres Ceibas who live abroad, and raise funds for the club's land.",
      ),
      description: t(
        "El proyecto Tres Ceiberos Ausente promueve la integración social y fortalece los valores culturales, religiosos y deportivos de la comunidad. Habrá presentaciones artísticas, exposición de artesanía local, feria gastronómica y kermés, misa comunitaria, torneo de baloncesto, jugada de gallos, juegos para niños, caminata y competencias de atletismo.",
        "Tres Ceiberos Ausente brings the community together and strengthens our cultural, religious and sports traditions. There will be performances, a local crafts fair, a food fair and kermes, a community mass, a basketball tournament, cockfights, games for children, a community walk and track events.",
      ),
      startDate: "2027-02-19",
      endDate: "2027-02-21",
      location: "La Cancha de Tres Ceibas, Villa Magante, R.D.",
      projectId: land,
      published: true,
      schedule: [
        {
          day: t("Viernes 19: apertura", "Friday 19: opening"),
          items: [
            { time: "10:00 a. m.", label: t("Jugada de gallos", "Cockfights"), responsible: "Comité organizador" },
            { time: "4:00 p. m.", label: t("Recibimiento de visitantes y participantes", "Welcome for visitors and participants"), responsible: "Comité organizador" },
            { time: "5:00 p. m.", label: t("Caminata comunitaria", "Community walk"), responsible: "Comité deportivo" },
            { time: "6:00 p. m.", label: t("Acto de apertura y palabras de bienvenida", "Opening ceremony and welcome"), responsible: "Comité organizador" },
            { time: "7:00 p. m.", label: t("Presentaciones artísticas y culturales", "Arts and cultural performances"), responsible: "Encargada de Cultura" },
            { time: "8:30 p. m.", label: t("Música típica y actividades de integración", "Traditional music and get-together"), responsible: "Comité organizador" },
          ],
        },
        {
          day: t("Sábado 20: deporte, cultura y recreación", "Saturday 20: sports, culture and fun"),
          items: [
            { time: "9:00 a. m.", label: t("Competencias de atletismo", "Track and field events"), responsible: "Comité deportivo" },
            { time: "10:30 a. m.", label: t("Torneo de baloncesto", "Basketball tournament"), responsible: "Entrenadores" },
            { time: "12:00 m.", label: t("Feria gastronómica y kermés", "Food fair and kermes"), responsible: "Comité organizador" },
            { time: "4:00 p. m.", label: t("Continuación del torneo de baloncesto", "Basketball tournament continues"), responsible: "Comité deportivo" },
            { time: "6:00 p. m.", label: t("Batón ballet y batallón estudiantil", "Baton twirling and student battalion"), responsible: "Comité cultural" },
            { time: "9:00 p. m.", label: t("Gran actividad cultural y convivencia comunitaria", "Big cultural night and community gathering"), responsible: "Comité organizador" },
          ],
        },
        {
          day: t("Domingo 21: convivencia, premiación y clausura", "Sunday 21: awards and closing"),
          items: [
            { time: "8:00 a. m.", label: t("Misa comunitaria", "Community mass"), responsible: "Comité religioso" },
            { time: "9:00 a. m.", label: t("Final del torneo de baloncesto", "Basketball final"), responsible: "Comité deportivo" },
            { time: "3:00 p. m.", label: t("Premiación de participantes y equipos ganadores", "Awards for participants and winning teams"), responsible: "Comité organizador" },
            { time: "4:00 p. m.", label: t("Palabras de agradecimiento y clausura", "Thank-you words and closing"), responsible: "Comité organizador" },
            { time: "5:00 p. m.", label: t("Despedida de visitantes", "Farewell to visitors"), responsible: "Comité organizador" },
          ],
        },
      ],
    });

    const members: [string, string, string][] = [
      ["Griselda Polanco Vásquez", "Encargada de Cultura", "Culture"],
      ["Robert Meléndez", "Representante en el exterior", "Representative abroad"],
      ["Juan José Ventura (Blanco)", "Enlace comunitario", "Community liaison"],
      ["Adán Polanco", "Deporte", "Sports"],
      ["Marcos Espaillat", "Deporte", "Sports"],
      ["Ramona Polanco", "Iglesia", "Church"],
    ];
    for (const [i, [name, es, en]] of members.entries()) {
      await ctx.db.insert("committee", { name, role: t(es, en), order: i + 1 });
    }
    await addProgram(ctx);
    return "Datos iniciales cargados.";
  },
});

type Category = Infer<typeof activityCategory>;
type ProgramItem = [slug: string, date: string, time: [start: string, end: string] | undefined, category: Category, responsible: string, es: [string, string], en: [string, string], endDate?: string];

/** Every activity of the Tres Ceiberos Ausente 2027 program, from the project document. */
const PROGRAM: ProgramItem[] = [
  ["jugada-de-gallos-2027", "2027-02-19", ["10:00", "13:00"], "community", "Comité organizador",
    ["Jugada de gallos", "La tradicional jugada de gallos abre el fin de semana de Tres Ceiberos Ausente."],
    ["Cockfights", "The traditional cockfights open the Tres Ceiberos Ausente weekend."]],
  ["recibimiento-visitantes-2027", "2027-02-19", ["16:00", "17:00"], "community", "Comité organizador",
    ["Recibimiento de visitantes y participantes", "Damos la bienvenida a los ceiberos que vienen del exterior y a todos los participantes."],
    ["Welcoming visitors and participants", "We welcome the ceiberos coming home from abroad and every participant."]],
  ["caminata-comunitaria-2027", "2027-02-19", ["17:00", "18:00"], "sports", "Comité deportivo",
    ["Caminata comunitaria", "Una caminata por la comunidad para todas las edades."],
    ["Community walk", "A walk through the community for all ages."]],
  ["acto-de-apertura-2027", "2027-02-19", ["18:00", "19:00"], "community", "Comité organizador",
    ["Acto de apertura y palabras de bienvenida", "Apertura oficial del evento con palabras del comité organizador."],
    ["Opening ceremony and welcome", "Official opening of the event with words from the organizing committee."]],
  ["presentaciones-artisticas-2027", "2027-02-19", ["19:00", "20:30"], "cultural", "Encargada de Cultura",
    ["Presentaciones artísticas y culturales", "Baile, música típica y talento de la comunidad."],
    ["Art and cultural performances", "Dance, traditional music and local talent."]],
  ["musica-tipica-integracion-2027", "2027-02-19", ["20:30", "23:00"], "cultural", "Comité organizador",
    ["Música típica y actividades de integración", "Cerramos el viernes con música típica y convivencia."],
    ["Traditional music and get-together", "We close Friday with traditional music and time together."]],
  ["juegos-infantiles-2027", "2027-02-19", undefined, "sports", "Comité organizador",
    ["Juegos recreativos para niños", "Juegos y actividades para los más pequeños durante todo el fin de semana."],
    ["Games for children", "Games and activities for the little ones all weekend long."], "2027-02-21"],
  ["competencias-atletismo-2027", "2027-02-20", ["09:00", "10:30"], "sports", "Comité deportivo",
    ["Competencias de atletismo", "Carreras y pruebas de atletismo para jóvenes y adultos."],
    ["Track and field events", "Races and track events for young people and adults."]],
  ["torneo-baloncesto-2027", "2027-02-20", ["10:30", "18:00"], "sports", "Entrenadores y comité deportivo",
    ["Torneo de baloncesto", "El torneo empieza el sábado a las 10:30 a. m., sigue a las 4:00 p. m. y la final se juega el domingo de 9:00 a 11:30 a. m."],
    ["Basketball tournament", "The tournament starts Saturday at 10:30 a.m., continues at 4:00 p.m., and the final is on Sunday from 9:00 to 11:30 a.m."], "2027-02-21"],
  ["feria-gastronomica-kermes-2027", "2027-02-20", ["12:00", "18:00"], "cultural", "Comité organizador",
    ["Feria gastronómica, kermés y artesanía", "Comida típica, kermés y exposición de artesanía local."],
    ["Food fair, kermes and crafts", "Traditional food, a kermes and a local crafts exhibit."]],
  ["baton-ballet-batallon-2027", "2027-02-20", ["18:00", "21:00"], "cultural", "Comité cultural",
    ["Batón ballet y batallón estudiantil", "Presentación del batón ballet y del batallón estudiantil."],
    ["Baton ballet and student battalion", "Performances by the baton ballet and the student battalion."]],
  ["gran-actividad-cultural-2027", "2027-02-20", ["21:00", "23:59"], "cultural", "Comité organizador",
    ["Gran actividad cultural y convivencia comunitaria", "La gran noche del sábado para compartir en comunidad."],
    ["Grand cultural night", "Saturday's big night to celebrate together as a community."]],
  ["misa-comunitaria-2027", "2027-02-21", ["08:00", "09:00"], "religious", "Comité religioso",
    ["Misa comunitaria", "Damos gracias juntos en la misa del domingo."],
    ["Community mass", "We give thanks together at Sunday mass."]],
  ["premiacion-2027", "2027-02-21", ["15:00", "16:00"], "community", "Comité organizador",
    ["Premiación de participantes y equipos ganadores", "Trofeos, medallas y reconocimientos para los ganadores."],
    ["Awards for participants and winning teams", "Trophies, medals and recognition for the winners."]],
  ["clausura-2027", "2027-02-21", ["16:00", "17:30"], "community", "Comité organizador",
    ["Palabras de agradecimiento, clausura y despedida", "Cierre del evento y despedida de los visitantes a las 5:00 p. m."],
    ["Thanks, closing and farewell", "Closing of the event and farewell to visitors at 5:00 p.m."]],
];

async function addProgram(ctx: MutationCtx) {
  const event = await ctx.db
    .query("activities")
    .withIndex("by_slug", (q) => q.eq("slug", "tres-ceiberos-ausente-2027"))
    .unique();
  if (!event) return 0;
  let added = 0;
  for (const [slug, date, time, category, responsible, es, en, endDate] of PROGRAM) {
    const exists = await ctx.db
      .query("activities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (exists) continue;
    await ctx.db.insert("activities", {
      slug,
      title: t(es[0], en[0]),
      summary: t(es[1], en[1]),
      description: t(es[1], en[1]),
      startDate: date,
      endDate: endDate ?? date,
      location: event.location,
      projectId: event.projectId,
      schedule: [],
      published: true,
      parentId: event._id,
      startTime: time?.[0],
      endTime: time?.[1],
      category,
      responsible,
    });
    added++;
  }
  return added;
}

/**
 * Adds any missing activities of the 2027 program to an existing database
 * without touching anything else:
 *   bunx convex run seed:program
 */
export const program = internalMutation({
  args: {},
  handler: async (ctx) => `Actividades agregadas: ${await addProgram(ctx)}`,
});

/**
 * One-time update for databases loaded before start and end times existed:
 * turns the old "4:00 p. m." text into startTime and fills in end times for
 * the 2027 program.   bunx convex run seed:migrateTimes
 */
export const migrateTimes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ends = new Map(PROGRAM.map(([slug, , time]) => [slug, time]));
    let updated = 0;
    for (const a of await ctx.db.query("activities").collect()) {
      if (!a.time && a.startTime) continue;
      const fromProgram = ends.get(a.slug);
      const startTime = a.startTime ?? fromProgram?.[0] ?? parseLegacyTime(a.time);
      const endTime = a.endTime ?? fromProgram?.[1];
      if (!a.time && !startTime) continue;
      await ctx.db.patch(a._id, { startTime, endTime, time: undefined });
      updated++;
    }
    return `Actividades actualizadas: ${updated}`;
  },
});
