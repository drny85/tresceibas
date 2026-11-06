import { internalMutation } from "./_generated/server";

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
    return "Datos iniciales cargados.";
  },
});
