// Translations for LeadLine. English and Spanish only, per the plan —
// Spanish chosen specifically for IL-07 relevance.
//
// Static strings live in STRINGS[lang]. Anything that depends on runtime
// data (percentages, names, conditionals) is a function below instead,
// so App.jsx never has to build sentences out of fragments by hand.

export const TONES = {
  lead: "danger",
  galvanized: "danger",
  suspected: "warn",
  nonlead: "safe",
  notfound: "warn",
  invalid: "warn",
};

export const STRINGS = {
  en: {
    dateLabel: "April 2025",
    nav: { lookup: "Check my address", compare: "Compare neighborhoods" },
    hero: {
      kicker: "Chicago has more lead water pipes than any U.S. city.",
      h1: "Find out what's under your street — and get the letter that gets it tested.",
      sub: "The city won't finish replacing every lead line until around 2076, and it has barely started warning residents. Look up your address, then take action in one tap.",
      placeholderLoading: "Loading Chicago dataset…",
      placeholder: "Enter a Chicago address",
      go: "Check my line",
      tryLabel: "Try a sample:",
      dataErr: "Couldn't load the address dataset. Refresh, or check your connection.",
    },
    about: {
      toTailor: "To tailor your steps:",
      rent: "I rent",
      own: "I own",
      kids: "Young kids at home",
      pregnant: "Someone pregnant",
    },
    share: {
      shareDefault: "Share this result",
      shareCopied: "Link copied!",
      summaryDefault: "Copy summary",
      summaryCopied: "Copied!",
    },
    suggest: "Nearby addresses on record — tap one if it's your building:",
    multiNote: (n) =>
      `This address has ${n} distinct service lines on record (common for multi-unit buildings). Showing the highest-risk one below — your specific unit may differ.`,
    parts: { gooseneck: "Gooseneck", public: "Public side", private: "Private side",
      goosenecksub: "connects to the water main", publicsub: "under the sidewalk — city-owned", privatesub: "runs into your home" },
    context: {
      heading: "Your neighborhood, in context",
      cityLabel: "Chicago citywide",
      viewOnMap: "View my neighborhood on the map",
      subFacts: (pov, min, income) =>
        `${pov}% poverty rate · ${min}% minority population · median household income $${income.toLocaleString()}. Chicago's lead pipe burden falls hardest on lower-income and minority neighborhoods.`,
    },
    plan: {
      heading: "Your next steps",
      reminderBtn: "Add a daily flush reminder to my calendar",
    },
    letter: {
      heading: "Send a letter that gets it tested",
      sub: "Drafted from verified city facts only — edit anything before you send it.",
      landlord: "To my landlord",
      alderman: "To my alderman",
      writing: "Writing your letter…",
      rewrite: "Rewrite letter",
      generate: "Generate my letter",
      offline: "Requires an internet connection",
      error: "Couldn't generate the letter just now. Check your connection and try again.",
      copy: "Copy",
      email: "Open in email",
      followupHeading: "Didn't hear back?",
      followupSub: "Give it about two weeks, then escalate if nothing's changed.",
      reminderBtn: "Remind me in 2 weeks to check back",
      extraLabel: "Anything to add for the follow-up? (optional)",
      extraPlaceholder: "e.g. the date you sent the first letter, or how they responded",
      escalateToAlderman: "Generate escalation letter to my alderman",
      escalateToComplaint: "Generate a formal 311 complaint",
      escalating: "Writing your escalation letter…",
      escalateAgain: "Rewrite escalation letter",
      nextStepLabel: "Suggested next step:",
    },
    chat: {
      heading: "Ask about your result",
      sub: "Answers are limited to your result and verified city facts — not medical advice.",
      placeholder: "e.g. Can I still shower normally?",
      send: "Ask",
      asking: "Thinking…",
      error: "Couldn't get an answer just now. Try again.",
      offline: "Requires an internet connection",
    },
    footer: {
      attribution:
        "Data: Chicago Dept. of Water Management service line inventory (April 2025), as cleaned and geocoded by",
      attributionEnd:
        ". This dataset is a snapshot and may contain errors or gaps — a free 311 test is the only way to confirm your result.",
      leadPaint: "Lead paint, not pipes, is still the leading cause of lead poisoning in Chicago children.",
      privacy: "Privacy: your address stays on your device. Nothing is saved except when you choose to generate a letter.",
      offlineNote: "This app works offline once loaded — your address and neighborhood data are cached on your device.",
    },
    compare: {
      heading: "Citywide comparison",
      sub: "The 20 Chicago community areas with the highest share of lead service lines needing replacement.",
      back: "← Back to address lookup",
      citywideAvg: (pct) => `Citywide average: ${pct}%`,
      legendLow: "Lower risk",
      legendHigh: "Higher risk",
      popupPct: "require replacement",
    },
    offlineBanner: "You're offline. Address lookup still works — the letter generator needs a connection.",
    categories: {
      lead: {
        label: "Lead",
        headline: "At least one part of your service line is known to be lead.",
        body: "Lead can dissolve or flake into your tap water — most when water has been sitting in the pipe. Having a lead line does not guarantee elevated lead (the city adds corrosion control), but you should act as if it could be present until a test says otherwise.",
      },
      galvanized: {
        label: "Galvanized — needs replacement",
        headline: "Your line has galvanized steel that needs replacing.",
        body: "Galvanized steel can trap and later release lead particles from lead pipe it was once connected to. The city classifies this as requiring replacement, so treat it like a lead result.",
      },
      suspected: {
        label: "Suspected lead",
        headline: "The city doesn't have confirmed data for your line.",
        body: "This is NOT a clean bill of health. \u201CSuspected\u201D means unknown — often based on the building's age — not safe. A free test is the only way to know.",
      },
      nonlead: {
        label: "No lead found",
        headline: "No lead or lead-contaminable material is recorded for your line.",
        body: "The city's inventory is incomplete and can contain errors, and interior plumbing or fixtures can still carry lead. A test is still the only way to be certain, but your recorded risk is low.",
      },
      notfound: {
        label: "Address not found",
        headline: "Your address isn't in the inventory — that doesn't mean you're safe.",
        body: "Many addresses are missing because one service line often serves several units, or the line is filed under a nearby intersection. Try a neighbor's address or request a free test to be sure.",
      },
      invalid: {
        label: "Couldn't read that address",
        headline: "Start with the house number, like \u201C1034 N Wells St\u201D.",
        body: "",
      },
    },
  },

  es: {
    dateLabel: "abril de 2025",
    nav: { lookup: "Buscar mi dirección", compare: "Comparar vecindarios" },
    hero: {
      kicker: "Chicago tiene más tuberías de agua con plomo que cualquier otra ciudad de EE. UU.",
      h1: "Descubra qué hay bajo su calle — y obtenga la carta que logra que se haga la prueba.",
      sub: "La ciudad no terminará de reemplazar todas las líneas de plomo hasta alrededor de 2076, y apenas ha comenzado a advertir a los residentes. Busque su dirección y actúe con un solo toque.",
      placeholderLoading: "Cargando datos de Chicago…",
      placeholder: "Ingrese una dirección de Chicago",
      go: "Revisar mi línea",
      tryLabel: "Pruebe un ejemplo:",
      dataErr: "No se pudieron cargar los datos. Actualice la página o revise su conexión.",
    },
    about: {
      toTailor: "Para personalizar sus pasos:",
      rent: "Alquilo",
      own: "Soy propietario",
      kids: "Niños pequeños en casa",
      pregnant: "Alguien embarazada",
    },
    share: {
      shareDefault: "Compartir este resultado",
      shareCopied: "¡Enlace copiado!",
      summaryDefault: "Copiar resumen",
      summaryCopied: "¡Copiado!",
    },
    suggest: "Direcciones cercanas registradas — toque una si es su edificio:",
    multiNote: (n) =>
      `Esta dirección tiene ${n} líneas de servicio distintas registradas (común en edificios de varias unidades). Se muestra abajo la de mayor riesgo — su unidad específica podría ser diferente.`,
    parts: { gooseneck: "Conexión al ramal", public: "Lado público", private: "Lado privado",
      goosenecksub: "conecta con la tubería principal", publicsub: "bajo la acera — propiedad de la ciudad", privatesub: "llega hasta su hogar" },
    context: {
      heading: "Su vecindario, en contexto",
      cityLabel: "Chicago (toda la ciudad)",
      viewOnMap: "Ver mi vecindario en el mapa",
      subFacts: (pov, min, income) =>
        `${pov}% de tasa de pobreza · ${min}% de población minoritaria · ingreso familiar medio de $${income.toLocaleString()}. La carga de las tuberías de plomo en Chicago recae con más fuerza en los vecindarios de bajos ingresos y minoritarios.`,
    },
    plan: {
      heading: "Sus próximos pasos",
      reminderBtn: "Agregar un recordatorio diario a mi calendario",
    },
    letter: {
      heading: "Envíe una carta que logre que se haga la prueba",
      sub: "Redactada únicamente con datos verificados de la ciudad — edite lo que desee antes de enviarla.",
      landlord: "A mi arrendador",
      alderman: "A mi concejal",
      writing: "Escribiendo su carta…",
      rewrite: "Reescribir carta",
      generate: "Generar mi carta",
      offline: "Requiere conexión a internet",
      error: "No se pudo generar la carta en este momento. Revise su conexión e intente de nuevo.",
      copy: "Copiar",
      email: "Abrir en correo",
      followupHeading: "¿No ha recibido respuesta?",
      followupSub: "Espere unas dos semanas y luego escale si nada ha cambiado.",
      reminderBtn: "Recordarme revisar en 2 semanas",
      extraLabel: "¿Algo que agregar para el seguimiento? (opcional)",
      extraPlaceholder: "por ejemplo, la fecha en que envió la primera carta, o cómo respondieron",
      escalateToAlderman: "Generar carta de escalamiento a mi concejal",
      escalateToComplaint: "Generar una queja formal al 311",
      escalating: "Escribiendo su carta de escalamiento…",
      escalateAgain: "Reescribir carta de escalamiento",
      nextStepLabel: "Siguiente paso sugerido:",
    },
    chat: {
      heading: "Pregunte sobre su resultado",
      sub: "Las respuestas se limitan a su resultado y a datos verificados de la ciudad — no son consejo médico.",
      placeholder: "por ejemplo, ¿puedo ducharme normalmente?",
      send: "Preguntar",
      asking: "Pensando…",
      error: "No se pudo obtener una respuesta en este momento. Intente de nuevo.",
      offline: "Requiere conexión a internet",
    },
    footer: {
      attribution:
        "Datos: inventario de líneas de servicio del Departamento de Manejo de Agua de Chicago (abril de 2025), depurado y geocodificado por",
      attributionEnd:
        ". Este conjunto de datos es una instantánea y puede contener errores u omisiones — una prueba gratuita del 311 es la única forma de confirmar su resultado.",
      leadPaint: "La pintura con plomo, no las tuberías, sigue siendo la principal causa de envenenamiento por plomo en los niños de Chicago.",
      privacy: "Privacidad: su dirección permanece en su dispositivo. No se guarda nada excepto cuando usted decide generar una carta.",
      offlineNote: "Esta aplicación funciona sin conexión una vez cargada — los datos de direcciones y vecindarios quedan guardados en su dispositivo.",
    },
    compare: {
      heading: "Comparación en toda la ciudad",
      sub: "Las 20 áreas comunitarias de Chicago con la mayor proporción de líneas de servicio de plomo que necesitan reemplazo.",
      back: "← Volver a la búsqueda de dirección",
      citywideAvg: (pct) => `Promedio de toda la ciudad: ${pct}%`,
      legendLow: "Riesgo menor",
      legendHigh: "Riesgo mayor",
      popupPct: "requieren reemplazo",
    },
    offlineBanner: "Está sin conexión. La búsqueda de direcciones sigue funcionando — la carta necesita conexión a internet.",
    categories: {
      lead: {
        label: "Plomo",
        headline: "Se sabe que al menos una parte de su línea de servicio es de plomo.",
        body: "El plomo puede disolverse o desprenderse en el agua del grifo, sobre todo cuando el agua ha permanecido en la tubería. Tener una línea de plomo no garantiza niveles elevados de plomo (la ciudad agrega control de corrosión), pero debe actuar como si pudiera estar presente hasta que una prueba indique lo contrario.",
      },
      galvanized: {
        label: "Galvanizada — necesita reemplazo",
        headline: "Su línea tiene acero galvanizado que necesita ser reemplazado.",
        body: "El acero galvanizado puede atrapar y luego liberar partículas de plomo de una tubería de plomo a la que estuvo conectado anteriormente. La ciudad clasifica esto como que requiere reemplazo, así que trátelo como un resultado de plomo.",
      },
      suspected: {
        label: "Se sospecha plomo",
        headline: "La ciudad no tiene datos confirmados sobre su línea.",
        body: "Esto NO significa que esté libre de riesgo. \u201CSospechoso\u201D significa desconocido — a menudo basado en la edad del edificio — no seguro. Una prueba gratuita es la única forma de saberlo con certeza.",
      },
      nonlead: {
        label: "No se encontró plomo",
        headline: "No se ha registrado plomo ni material contaminable con plomo en su línea.",
        body: "El inventario de la ciudad está incompleto y puede contener errores, y la plomería o los accesorios interiores todavía pueden contener plomo. Una prueba sigue siendo la única forma de estar seguro, pero su riesgo registrado es bajo.",
      },
      notfound: {
        label: "Dirección no encontrada",
        headline: "Su dirección no está en el inventario — eso no significa que esté a salvo.",
        body: "Muchas direcciones faltan porque una sola línea de servicio a menudo atiende a varias unidades, o la línea está registrada bajo una intersección cercana. Intente con la dirección de un vecino o solicite una prueba gratuita para estar seguro.",
      },
      invalid: {
        label: "No se pudo leer esa dirección",
        headline: "Comience con el número de la casa, como \u201C1034 N Wells St\u201D.",
        body: "",
      },
    },
  },
};

/** Builds the "In {name}, X% require replacement — higher/lower than citywide" sentence. */
export function contextSentence(lang, name, pct, citywidePct) {
  if (lang === "es") {
    const base = `En ${name}, el ${pct}% de las líneas de servicio requieren reemplazo`;
    if (pct > citywidePct) return `${base} — más alto que la tasa de toda la ciudad de ${citywidePct}%.`;
    if (pct < citywidePct) return `${base} — más bajo que la tasa de toda la ciudad de ${citywidePct}%.`;
    return `${base} — aproximadamente igual a la tasa de toda la ciudad.`;
  }
  const base = `In ${name}, ${pct}% of service lines require replacement`;
  if (pct > citywidePct) return `${base} — higher than the citywide rate of ${citywidePct}%.`;
  if (pct < citywidePct) return `${base} — lower than the citywide rate of ${citywidePct}%.`;
  return `${base} — about the same as the citywide rate.`;
}

/** Builds the tailored action-plan step list for the given language + situation. */
export function actionPlanSteps(lang, { catKey, kids, pregnant, tenure }) {
  if (!catKey || catKey === "invalid") return [];
  const steps = [];

  if (lang === "es") {
    if (catKey === "notfound") {
      return [
        "Llame al 311 para solicitar una prueba gratuita de plomo en el agua — la forma más segura de saberlo cuando su dirección no aparece en la lista.",
        "Revise las direcciones cercanas sugeridas abajo — su línea podría estar registrada bajo un número vecino.",
      ];
    }
    if (catKey !== "nonlead") {
      steps.push("Llame al 311 para solicitar una prueba gratuita de plomo en el agua — es la única forma de conocer sus niveles reales.");
      if (kids || pregnant)
        steps.push("Use únicamente agua fría y filtrada para beber, cocinar y preparar fórmula para bebés. El agua caliente del grifo arrastra más plomo.");
      steps.push("Deje correr el agua fría durante 5 minutos o más antes de beber o cocinar cada vez que el grifo haya estado sin usarse 6 horas o más.");
      steps.push("Use un filtro certificado para plomo (busque NSF/ANSI 53). Pregunte si califica para el programa de filtros gratuitos de la ciudad.");
      if (tenure === "rent")
        steps.push("Envíele a su arrendador la carta de abajo — es responsable de la plomería del edificio y puede solicitar pruebas y reemplazo.");
      else steps.push("Verifique si califica para el programa de reemplazo de líneas de servicio de plomo de la ciudad.");
    } else {
      steps.push("Riesgo registrado bajo — pero la plomería y los accesorios interiores todavía pueden contener plomo. Una prueba gratuita del 311 lo confirma.");
      steps.push("Aun así vale la pena dejar correr el agua después de períodos largos sin uso, especialmente a primera hora de la mañana.");
    }
    return steps;
  }

  // English
  if (catKey === "notfound") {
    return [
      "Call 311 to request a free lead water test — the safest way to know when your address isn't listed.",
      "Check the suggested nearby addresses below — your line may be filed under a neighboring number.",
    ];
  }
  if (catKey !== "nonlead") {
    steps.push("Call 311 to request a free lead water test — it's the only way to know your actual levels.");
    if (kids || pregnant)
      steps.push("Use only cold, filtered water for drinking, cooking, and baby formula. Hot tap water pulls in more lead.");
    steps.push("Run cold water 5+ minutes before drinking or cooking whenever the tap has sat unused for 6 hours or more.");
    steps.push("Use a filter certified for lead (look for NSF/ANSI 53). Ask if you qualify for the city's free filter program.");
    if (tenure === "rent")
      steps.push("Send your landlord the letter below — they own the building's plumbing and can request testing and replacement.");
    else steps.push("Check your eligibility for the city's lead service line replacement program.");
  } else {
    steps.push("Low recorded risk — but interior plumbing and fixtures can still carry lead. A free 311 test confirms it.");
    steps.push("Still worth flushing after long idle periods, especially first thing in the morning.");
  }
  return steps;
}
