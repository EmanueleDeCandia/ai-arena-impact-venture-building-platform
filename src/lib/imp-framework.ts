export type ImpactDimensionKey = "WHAT" | "WHO" | "HOW_MUCH" | "CONTRIBUTION" | "RISK";

export type ImpactClassification = "ACT_TO_AVOID_HARM" | "BENEFIT_STAKEHOLDERS" | "CONTRIBUTE_TO_SOLUTIONS";

export interface ImpactCategoryDef {
  id: number;
  ref?: string;
  dimension: ImpactDimensionKey;
  dimensionLabel: string;
  name: string;
  originalName: string;
  definition: string;
  operationalGuidance: string;
  assessmentType: "select" | "text" | "risk_type";
  assessmentOptions?: { value: string; label: string; original: string }[];
  defaultIndicator: string;
  defaultData: string;
  defaultSource: string;
  defaultAssessment: string;
  defaultTarget?: string;
}

export interface ImpactRowData {
  categoryId: number;
  indicator: string;
  data: string;
  source: string;
  sourceType: "SELF_REPORTED" | "NON_SELF_REPORTED" | "MIXED";
  assessment: string;
  target?: string;
}

export interface ImpactItem {
  id: string;
  title: string;
  description: string;
  classification: ImpactClassification;
  rows: ImpactRowData[];
}

export type AttuatorType =
  | "IMPRESA_SOCIALE"
  | "STARTUP_INNOVATIVA_IMPATTO"
  | "ASSOCIAZIONE_NON_PROFIT"
  | "COOPERATIVA_SOCIALE"
  | "ENTE_TERZO_SETTORE";

export type TargetSupporterType =
  | "PA_PUBBLICA_AMMINISTRAZIONE"
  | "IMPACT_INVESTOR"
  | "IMPRESA_FINANZIATRICE_CSR"
  | "FONDAZIONE_BANCARIA";

export interface AttuatorProfile {
  name: string;
  type: AttuatorType;
  sector: string;
  targetSupporter: TargetSupporterType;
  mission: string;
  territory: string;
  overallClassification: ImpactClassification;
}

export const ATTUATOR_TYPE_LABELS: Record<AttuatorType, string> = {
  IMPRESA_SOCIALE: "Impresa Sociale (D.Lgs. 112/2017)",
  STARTUP_INNOVATIVA_IMPATTO: "Startup Innovativa a Vocazione Sociale",
  ASSOCIAZIONE_NON_PROFIT: "Associazione / Organizzazione Non Profit",
  COOPERATIVA_SOCIALE: "Cooperativa Sociale (Tipo A / B)",
  ENTE_TERZO_SETTORE: "Ente del Terzo Settore (ETS)",
};

export const TARGET_SUPPORTER_LABELS: Record<TargetSupporterType, string> = {
  PA_PUBBLICA_AMMINISTRAZIONE: "Pubblica Amministrazione (Bandi, Co-progettazione, SIB)",
  IMPACT_INVESTOR: "Investitore ad Impatto (Venture Philanthropy, Fondo ESG)",
  IMPRESA_FINANZIATRICE_CSR: "Impresa Finanziatrice / Corporate CSR & Open Innovation",
  FONDAZIONE_BANCARIA: "Fondazione Erogativa / Ente Filantropico",
};

export const CLASSIFICATION_INFO: Record<
  ImpactClassification,
  { label: string; english: string; description: string; badgeCls: string; code: string }
> = {
  ACT_TO_AVOID_HARM: {
    code: "A",
    label: "Agire per Evitare Danni",
    english: "Act to avoid harm",
    description: "L'organizzazione previene o riduce gli effetti negativi per i propri stakeholder e l'ambiente.",
    badgeCls: "bg-amber-100 text-amber-800 border-amber-300",
  },
  BENEFIT_STAKEHOLDERS: {
    code: "B",
    label: "Generare Benefici per gli Stakeholder",
    english: "Benefit stakeholders",
    description: "L'organizzazione genera impatti positivi tangibili e duraturi per i propri beneficiari primari.",
    badgeCls: "bg-sky-100 text-sky-800 border-sky-300",
  },
  CONTRIBUTE_TO_SOLUTIONS: {
    code: "C",
    label: "Contribuire a Soluzioni Sistemiche",
    english: "Contribute to solutions",
    description: "L'organizzazione genera un cambiamento profondo affrontando sfide sociali o ambientali complesse e sottoservite.",
    badgeCls: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
};

export const IMP_RISK_TYPES = [
  { value: "Evidence risk", label: "Evidence Risk (Rischio di prova/dati insufficienti)", desc: "Dati di scarsa qualità o non attendibili per provare l'esito." },
  { value: "External risk", label: "External Risk (Rischio fattori esterni/macroeconomici)", desc: "Eventi esogeni che limitano il raggiungimento dell'impatto." },
  { value: "Execution risk", label: "Execution Risk (Rischio di esecuzione e capacità operativa)", desc: "Attività non eseguita secondo le specifiche o i tempi stabiliti." },
  { value: "Stakeholder participation risk", label: "Stakeholder Participation Risk (Rischio mancata adesione)", desc: "I beneficiari non partecipano o abbandonano il programma." },
  { value: "Drop-off risk", label: "Drop-off Risk (Rischio decadimento del beneficio)", desc: "I risultati positivi svaniscono più rapidamente del previsto." },
  { value: "Unexpected impact risk", label: "Unexpected Impact Risk (Rischio impatti negativi inattesi)", desc: "L'intervento genera esiti negativi collaterali." },
  { value: "Efficiency risk", label: "Efficiency Risk (Rischio inefficienza costi/risorse)", desc: "L'impatto avrebbe potuto essere generato a costi inferiori." },
  { value: "Alignment risk", label: "Alignment Risk (Rischio disallineamento stakeholder)", desc: "Gli obiettivi dei sostenitori divergono da quelli dei beneficiari." },
  { value: "Endurance risk", label: "Endurance Risk (Rischio continuità/sostenibilità nel tempo)", desc: "L'impatto non dura dopo il termine dei finanziamenti." },
];

export const IMP_CATEGORIES: ImpactCategoryDef[] = [
  // 1. WHAT
  {
    id: 1,
    ref: "i",
    dimension: "WHAT",
    dimensionLabel: "WHAT (Cosa si genera)",
    name: "Livello di esito nel periodo (Outcome level in period)",
    originalName: "Outcome level in period (i)",
    definition: "Il livello di esito (outcome) sperimentato dallo stakeholder a seguito del coinvolgimento con l'organizzazione. L'esito può essere positivo o negativo, intenzionale o inatteso.",
    operationalGuidance: "Rilevazione survey: Domande aperte sul miglioramento cercato e risposte su scala Likert.",
    assessmentType: "select",
    assessmentOptions: [
      { value: "Positive", label: "Positivo (Positive)", original: "Positive" },
      { value: "Negative", label: "Negativo (Negative)", original: "Negative" },
    ],
    defaultIndicator: "Tasso di inserimento lavorativo stabile / incremento retributivo",
    defaultData: "+42% di occupati a 6 mesi",
    defaultSource: "Survey post-intervento e contratti registrati",
    defaultAssessment: "Positive",
    defaultTarget: "+35% entro 12 mesi",
  },
  {
    id: 2,
    dimension: "WHAT",
    dimensionLabel: "WHAT (Cosa si genera)",
    name: "Soglia di esito (Outcome threshold)",
    originalName: "Outcome threshold",
    definition: "Il livello di esito che lo stakeholder considera positivo o accettabile. Qualsiasi valore al di sotto è considerato negativo. Può basarsi su standard nazionali o internazionali.",
    operationalGuidance: "Rilevazione di adeguatezza: verificare se l'entità del cambiamento soddisfa il bisogno primario dello stakeholder.",
    assessmentType: "text",
    defaultIndicator: "Soglia salariale di dignità / Livello minimo di autosufficienza",
    defaultData: "Reddito > 1.200 €/mese (CCNL di riferimento)",
    defaultSource: "Standard ISTAT / Benchmark retributivo territoriale",
    defaultAssessment: "Soglia superata nel 91% dei casi",
    defaultTarget: "100% rispetto della soglia minima",
  },
  {
    id: 3,
    dimension: "WHAT",
    dimensionLabel: "WHAT (Cosa si genera)",
    name: "Importanza dell'esito per lo stakeholder (Importance to stakeholder)",
    originalName: "Importance of the outcome to stakeholder",
    definition: "La percezione dello stakeholder circa la rilevanza prioritaria dell'esito rispetto ad altri aspetti della propria vita o dell'ecosistema.",
    operationalGuidance: "Scala di rilevanza somministrata direttamente ai beneficiari (Very Important, Important).",
    assessmentType: "text",
    defaultIndicator: "Grado di priorità percepito dal beneficiario (Scala 1-5)",
    defaultData: "4.8 / 5.0 (Priorità primaria assoluta)",
    defaultSource: "Interviste dirette ai partecipanti",
    defaultAssessment: "Molto rilevante per l'emancipazione personale",
    defaultTarget: "> 4.5 / 5.0",
  },
  {
    id: 4,
    dimension: "WHAT",
    dimensionLabel: "WHAT (Cosa si genera)",
    name: "Target SDG o obiettivo globale (SDG target / global goal)",
    originalName: "SDG target or other global goal",
    definition: "Il traguardo degli Obiettivi di Sviluppo Sostenibile dell'ONU (o altro standard globale) a cui l'esito è direttamente correlato.",
    operationalGuidance: "Mappatura puntuale su target SDG 1-17 e relativi indicatori ONU.",
    assessmentType: "select",
    assessmentOptions: [
      { value: "Important", label: "Importante / Prioritario (Important)", original: "Important" },
      { value: "Unimportant", label: "Non prioritario (Unimportant)", original: "Unimportant" },
    ],
    defaultIndicator: "SDG 8.5 (Lavoro dignitoso e piena occupazione) & SDG 10.2 (Inclusione sociale)",
    defaultData: "Allineamento diretto con Target ONU 8.5 e 10.2",
    defaultSource: "Framework ONU Agenda 2030",
    defaultAssessment: "Important",
    defaultTarget: "Conformità piena a indicatori SDG",
  },

  // 2. WHO
  {
    id: 5,
    dimension: "WHO",
    dimensionLabel: "WHO (Chi vive l'impatto)",
    name: "Stakeholder / Beneficiari",
    originalName: "Stakeholder",
    definition: "La tipologia e segmento specifico di stakeholder che sperimenta il cambiamento (es. giovani NEET, persone svantaggiate, dipendenti, pianeta/ambiente).",
    operationalGuidance: "Definizione chiara della coorte target e dei criteri di selezione.",
    assessmentType: "text",
    defaultIndicator: "Categoria e numerosità del target di riferimento",
    defaultData: "Giovani NEET (18-29 anni) e disoccupati di lunga durata",
    defaultSource: "Registri Centro per l'Impiego & Anagrafica ETS",
    defaultAssessment: "Segmento altamente vulnerabile e mirato",
    defaultTarget: "120 beneficiari annui",
  },
  {
    id: 6,
    dimension: "WHO",
    dimensionLabel: "WHO (Chi vive l'impatto)",
    name: "Confine Geografico (Geographical Boundary)",
    originalName: "Geographical Boundary",
    definition: "L'ambito territoriale in cui si manifesta l'impatto sociale o ambientale (quartiere, comune, provincia, regione, scala transfrontaliera).",
    operationalGuidance: "Delimitazione dell'area geografica e delle sue peculiarità socio-economiche.",
    assessmentType: "text",
    defaultIndicator: "Comuni e quartieri ad alta marginalità socio-economica",
    defaultData: "Città Metropolitana di Bari (Quartieri periferici)",
    defaultSource: "Dati cartografici e zonizzazione PNRR/FSE",
    defaultAssessment: "Area a forte deficit occupazionale e formativo",
    defaultTarget: "Estensione a 3 comuni limitrofi",
  },
  {
    id: 7,
    ref: "ii",
    dimension: "WHO",
    dimensionLabel: "WHO (Chi vive l'impatto)",
    name: "Livello di esito alla baseline (Outcome level at baseline)",
    originalName: "Outcome level at baseline (ii)",
    definition: "La condizione di partenza e il livello di risorse dello stakeholder prima dell'intervento dell'organizzazione.",
    operationalGuidance: "Misurazione delle condizioni pregresse all'ingresso tramite questionari di anamnesi o indici di povertà/vulnerabilità (PPI).",
    assessmentType: "select",
    assessmentOptions: [
      { value: "Underserved", label: "Sottoservito / Vulnerabile (Underserved)", original: "Underserved" },
      { value: "Well-served", label: "Ben servito / Autonomo (Well-served)", original: "Well-served" },
    ],
    defaultIndicator: "Indice di vulnerabilità socio-economica all'ingresso",
    defaultData: "88% dei candidati privi di reddito e titolo specialistico",
    defaultSource: "Assessment diagnostico di ingresso",
    defaultAssessment: "Underserved",
    defaultTarget: "100% selezione in condizioni di bisogno accertato",
  },
  {
    id: 8,
    dimension: "WHO",
    dimensionLabel: "WHO (Chi vive l'impatto)",
    name: "Caratteristiche dello stakeholder (Stakeholder characteristics)",
    originalName: "Stakeholder characteristics",
    definition: "Variabili socio-demografiche, comportamentali o ambientali impiegate per disaggregare e segmentare le risposte.",
    operationalGuidance: "Segmentazione per genere, fascia di età, grado di istruzione e storico lavorativo.",
    assessmentType: "text",
    defaultIndicator: "Distribuzione per genere, età e titolo di studio",
    defaultData: "55% donne, età media 24.3 anni, 68% diploma scuola secondaria",
    defaultSource: "Fascicolo anagrafico",
    defaultAssessment: "Bilanciamento di genere e forte presenza giovanile",
    defaultTarget: "Equità di genere >= 50% donne",
  },

  // 3. HOW MUCH
  {
    id: 9,
    dimension: "HOW_MUCH",
    dimensionLabel: "HOW MUCH (Quanto impatto)",
    name: "Scala (Scale)",
    originalName: "Scale",
    definition: "Il numero complessivo di individui o la quota di beneficiari che sperimentano l'esito (non applicabile se lo stakeholder è il pianeta).",
    operationalGuidance: "Dato quantitativo consuntivo rilevato dal gestionale.",
    assessmentType: "select",
    assessmentOptions: [
      { value: "Large scale", label: "Larga scala / Ampia portata (Large scale)", original: "Large scale" },
      { value: "Small scale", label: "Piccola scala / Pilota (Small scale)", original: "Small scale" },
    ],
    defaultIndicator: "Numero totale di beneficiari unici formati e avviati",
    defaultData: "150 partecipanti inseriti nei percorsi annuali",
    defaultSource: "Registro presenze e attestati rilasciati",
    defaultAssessment: "Large scale",
    defaultTarget: "200 partecipanti nel triennio",
  },
  {
    id: 10,
    dimension: "HOW_MUCH",
    dimensionLabel: "HOW MUCH (Quanto impatto)",
    name: "Profondità del cambiamento (Depth)",
    originalName: "Depth",
    definition: "Il grado di variazione sperimentato dal beneficiario. Si calcola formalmente analizzando la differenza tra la baseline (Who - ii) e il periodo consuntivo (What - i).",
    operationalGuidance: "Delta matematico o qualitativo tra condizione pre e post intervento.",
    assessmentType: "select",
    assessmentOptions: [
      { value: "Deep change", label: "Cambiamento profondo e strutturale (Deep change)", original: "Deep change" },
      { value: "Marginal change", label: "Cambiamento marginale / Incrementale (Marginal change)", original: "Marginal change" },
    ],
    defaultIndicator: "Variazione dello stato di autosufficienza e stabilità economica",
    defaultData: "Transizione da disoccupazione totale a contratto a tempo indeterminato",
    defaultSource: "Confronto storico Baseline vs Periodo attuale",
    defaultAssessment: "Deep change",
    defaultTarget: "Delta occupazionale > 60%",
  },
  {
    id: 11,
    dimension: "HOW_MUCH",
    dimensionLabel: "HOW MUCH (Quanto impatto)",
    name: "Durata dell'esito (Duration)",
    originalName: "Duration",
    definition: "L'orizzonte temporale durante il quale lo stakeholder continua a beneficiare dell'esito generato.",
    operationalGuidance: "Monitoraggio longitudinale a 6, 12, 24 e 36 mesi.",
    assessmentType: "select",
    assessmentOptions: [
      { value: "Long term", label: "Lungo termine / Persistente (Long term)", original: "Long term" },
      { value: "Short term", label: "Breve termine / Temporaneo (Short term)", original: "Short term" },
    ],
    defaultIndicator: "Persistenza del lavoro e dell'inclusione a 24 mesi",
    defaultData: "Tasso di ritenzione contrattuale dell'84% a 24 mesi",
    defaultSource: "Follow-up periodico semestrale",
    defaultAssessment: "Long term",
    defaultTarget: "Stabilità > 80% a 24 mesi",
  },

  // 4. CONTRIBUTION
  {
    id: 12,
    dimension: "CONTRIBUTION",
    dimensionLabel: "CONTRIBUTION (Addizionalità & Contributo)",
    name: "Controfattuale di Profondità (Depth counterfactual)",
    originalName: "Depth counterfactual",
    definition: "Il grado stimato di cambiamento che si sarebbe comunque verificato anche senza l'intervento dell'organizzazione (scenario inerziale o alternative di mercato).",
    operationalGuidance: "Stima tramite confronto con benchmark di settore, gruppi di controllo o alternative pubbliche disponibili.",
    assessmentType: "select",
    assessmentOptions: [
      { value: "Likely better", label: "Probabilmente migliore dell'inerzia (Likely better)", original: "Likely better" },
      { value: "Likely worse", label: "Probabilmente peggiore o identico (Likely worse)", original: "Likely worse" },
    ],
    defaultIndicator: "Differenziale occupazionale rispetto al tasso medio di uscita dalla disoccupazione",
    defaultData: "Tasso di inserimento del nostro progetto: 72% vs media regionale spontanea: 18%",
    defaultSource: "Benchmark ANPAL / Osservatorio Regionale del Lavoro",
    defaultAssessment: "Likely better",
    defaultTarget: "Addizionalità netta > +40%",
  },
  {
    id: 13,
    dimension: "CONTRIBUTION",
    dimensionLabel: "CONTRIBUTION (Addizionalità & Contributo)",
    name: "Controfattuale di Durata (Duration counterfactual)",
    originalName: "Duration counterfactual",
    definition: "Il periodo temporale stimato durante il quale l'esito sarebbe durato comunque in assenza dell'intervento dell'organizzazione.",
    operationalGuidance: "Valutazione della persistenza dei contratti precari tipici del mercato standard vs contratti stabili generati.",
    assessmentType: "select",
    assessmentOptions: [
      { value: "Likely better", label: "Probabilmente più duraturo (Likely better)", original: "Likely better" },
      { value: "Likely worse", label: "Probabilmente meno duraturo (Likely worse)", original: "Likely worse" },
    ],
    defaultIndicator: "Durata media del rapporto lavorativo rispetto a tirocini standard",
    defaultData: "Durata media 28 mesi vs 4.5 mesi dei contratti a termine convenzionali",
    defaultSource: "Dati amministrativi territoriali",
    defaultAssessment: "Likely better",
    defaultTarget: "Durata tripla rispetto al benchmark",
  },

  // 5. RISK
  {
    id: 14,
    dimension: "RISK",
    dimensionLabel: "RISK (Rischio di Impatto)",
    name: "Tipologia di Rischio di Impatto (Risk type)",
    originalName: "Risk type",
    definition: "La specifica categoria tra i 9 rischi codificati dall'IMP che potrebbe compromettere la generazione dell'impatto atteso.",
    operationalGuidance: "Identificazione del rischio dominante tra: Evidence, External, Execution, Stakeholder participation, Drop-off, Unexpected impact, Efficiency, Alignment, Endurance.",
    assessmentType: "risk_type",
    assessmentOptions: [
      { value: "Low risk", label: "Basso rischio complessivo (Low risk)", original: "Low risk" },
      { value: "High risk", label: "Alto rischio / Da monitorare (High risk)", original: "High risk" },
    ],
    defaultIndicator: "Execution Risk & Stakeholder Participation Risk",
    defaultData: "Rischio moderato legato al turnover dei tutor e drop-out dei giovani",
    defaultSource: "Matrice di Risk Management e Log di progetto",
    defaultAssessment: "Low risk",
    defaultTarget: "Piano di mitigazione e tutoraggio 1:1 attivo",
  },
  {
    id: 15,
    dimension: "RISK",
    dimensionLabel: "RISK (Rischio di Impatto)",
    name: "Livello di Rischio Sintetico (Risk level)",
    originalName: "Risk level",
    definition: "Il livello di rischio combinando la probabilità di accadimento con la gravità delle conseguenze per le persone o per l'ambiente.",
    operationalGuidance: "Sintesi qualitativa o quantitativa (Probabilità x Impatto) con piano di presidio e mitigazione.",
    assessmentType: "text",
    defaultIndicator: "Indice di Severità x Probabilità (Scala 1-25)",
    defaultData: "Punteggio 6/25 (Probabilità Bassa 2 x Severità Media 3)",
    defaultSource: "Comitato di Valutazione d'Impatto",
    defaultAssessment: "Rischio pienamente presidiato e gestito",
    defaultTarget: "Score rischio < 8/25",
  },
];

export const INITIAL_DEFAULT_IMPACTS: ImpactItem[] = [
  {
    id: "imp-1",
    title: "Impatto 1: Inserimento Lavorativo Stabile e Upskilling Digitale",
    description: "Percorso integrato di formazione professionale avanzata e collocamento a tempo indeterminato per giovani NEET e disoccupati fragili.",
    classification: "CONTRIBUTE_TO_SOLUTIONS",
    rows: IMP_CATEGORIES.map((cat) => ({
      categoryId: cat.id,
      indicator: cat.defaultIndicator,
      data: cat.defaultData,
      source: cat.defaultSource,
      sourceType: cat.id % 2 === 0 ? "NON_SELF_REPORTED" : "SELF_REPORTED",
      assessment: cat.defaultAssessment,
      target: cat.defaultTarget,
    })),
  },
  {
    id: "imp-2",
    title: "Impatto 2: Riduzione Dispersione Scolastica e Supporto Educativo",
    description: "Intervento territoriale di contrasto alla povertà educativa minorile con laboratori STEM e supporto pomeridiano alle famiglie a basso reddito.",
    classification: "BENEFIT_STAKEHOLDERS",
    rows: IMP_CATEGORIES.map((cat) => {
      let customData = cat.defaultData;
      let customIndicator = cat.defaultIndicator;
      let customAssessment = cat.defaultAssessment;
      if (cat.id === 1) {
        customIndicator = "Miglioramento rendimento scolastico & frequenza";
        customData = "-65% assenze ingiustificate, +1.8 voti medi";
        customAssessment = "Positive";
      } else if (cat.id === 5) {
        customIndicator = "Studenti secondaria di I grado e famiglie fragili";
        customData = "85 minori e rispettivi nuclei familiari";
      } else if (cat.id === 9) {
        customIndicator = "Minori seguiti continuativamente nell'anno scolastico";
        customData = "85 studenti coinvolti";
        customAssessment = "Small scale";
      } else if (cat.id === 10) {
        customIndicator = "Delta recupero debiti formativi";
        customData = "Promozione del 94% degli studenti a rischio bocciatura";
        customAssessment = "Deep change";
      } else if (cat.id === 14) {
        customIndicator = "Drop-off Risk & External Risk";
        customData = "Rischio abbandono estivo mitigato da summer camp";
        customAssessment = "Low risk";
      }
      return {
        categoryId: cat.id,
        indicator: customIndicator,
        data: customData,
        source: cat.defaultSource,
        sourceType: "MIXED",
        assessment: customAssessment,
        target: cat.defaultTarget,
      };
    }),
  },
];

export const INITIAL_DEFAULT_PROFILE: AttuatorProfile = {
  name: "Consorzio Futuro Sociale & Tech ETS",
  type: "IMPRESA_SOCIALE",
  sector: "Occupabilità Giovanile, Formazione Digitale & Rigenerazione Territoriale",
  targetSupporter: "PA_PUBBLICA_AMMINISTRAZIONE",
  mission: "Generare occupazione stabile di qualità e contrastare la marginalità educativa nelle periferie urbane attraverso modelli imprenditoriali ad alto impatto sociale e innovazione tecnologica.",
  territory: "Puglia e Mezzogiorno (Città Metropolitana di Bari)",
  overallClassification: "CONTRIBUTE_TO_SOLUTIONS",
};
