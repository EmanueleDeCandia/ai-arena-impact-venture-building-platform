import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, ensureDbReady } from "./index";
import * as s from "./schema";

/** Dataset demo: copre tutte le fasi del workflow e tutti i moduli (RF-01…RF-12). */
export async function seedDatabase() {
  await ensureDbReady();
  await db.execute(sql`
    TRUNCATE TABLE audit_log, comments, impact_tokens, wallet_transactions, documents,
    evidences, kpis, tranches, stakeholders, projects, opportunities, users
    RESTART IDENTITY CASCADE
  `);

  const users = await db
    .insert(s.users)
    .values([
      { name: "Marta Rinaldi", email: "marta.rinaldi@impactforge.io", role: "SUPER_ADMIN", orgName: "Impact Forge" },
      { name: "Luca Ferri", email: "luca.ferri@impactforge.io", role: "TERRITORIAL_ANALYST", orgName: "Impact Forge" },
      { name: "Giulia Moretti", email: "giulia.moretti@impactforge.io", role: "ORIGINATOR", orgName: "Impact Forge" },
      { name: "Enzo Bianchi", email: "enzo.bianchi@bancaetica.it", role: "BANK_PROMOTER", orgName: "Banca Etica Nordest" },
      { name: "Sofia Marchetti", email: "sofia@fondomeridiano.it", role: "FUND_MANAGER", orgName: "Fondo Meridiano" },
      { name: "Andrea Colombo", email: "andrea@consorzioeletrico.it", role: "ANCHOR_COMPANY", orgName: "Consorzio Elettrico Trentino" },
      { name: "Elena Rossi", email: "elena@coopradici.it", role: "ETS_IMPLEMENTER", orgName: "Coop. Sociale Radici" },
      { name: "Paolo Greco", email: "paolo.greco@comune.taranto.it", role: "PA_VALIDATOR", orgName: "Comune di Taranto" },
      { name: "Maria Serra", email: "maria.serra@valfiemme.it", role: "COMMUNITY_VALIDATOR", orgName: "Comunità Val Fiemme" },
      { name: "Franco Vitale", email: "franco@studiaudit.it", role: "AUDITOR", orgName: "Studio Audit & Impact" },
    ])
    .returning();
  const [marta, luca, giulia, enzo, sofia, andrea, elena, paolo, maria, franco] = users;

  const opps = await db
    .insert(s.opportunities)
    .values([
      {
        title: "Rigenerazione servizi di prossimità — Val di Fiemme",
        description:
          "Tre botteghe storiche chiuse, un ex macello comunale inutilizzato e un saldo migratorio giovanile negativo da 5 anni: servizi di prossimità come leva anti-spopolamento.",
        territory: "Trentino-Alto Adige",
        commune: "Cavalese",
        gravity: 8,
        populationTarget: "Giovani 18-35 in uscita dal territorio",
        assets: "Ex macello comunale 1.800 mq + 3 botteghe chiuse",
        source: "ISTAT BES + OpenCoesione",
        economicPotential: 2_400_000,
        opportunityScore: 87,
        suggestedStakeholders: ["ANCHOR_COMPANY", "BANK_PROMOTER", "ETS_IMPLEMENTER", "PA_VALIDATOR"],
        status: "CONVERTED",
        createdBy: luca.id,
      },
      {
        title: "Comunità Energetica Rinnovabile — Cilento Interno",
        description:
          "Povertà energetica al 22% nelle famiglie dei comuni interni: le coperture comunali e scolastiche possono alimentare una CER con 2.500 soci.",
        territory: "Campania",
        commune: "Ceraso",
        gravity: 9,
        populationTarget: "Famiglie in povertà energetica",
        assets: "Coperture comunali e scolastiche 12.000 mq",
        source: "ISTAT BES + bandi GSE",
        economicPotential: 3_100_000,
        opportunityScore: 92,
        suggestedStakeholders: ["ANCHOR_COMPANY", "ETS_IMPLEMENTER", "BANK_PROMOTER", "COMMUNITY_VALIDATOR"],
        status: "CONVERTED",
        createdBy: luca.id,
      },
      {
        title: "NEET e competenze digitali — Taranto",
        description:
          "Tasso NEET al 32% nel quartiere Tamburi: una scuola dismessa e il distretto IT locale possono diventare una Scuola dei Mestieri Digitali.",
        territory: "Puglia",
        commune: "Taranto",
        gravity: 9,
        populationTarget: "NEET 15-29 (1.400 persone)",
        assets: "Scuola dismessa quartiere Tamburi",
        source: "OpenCoesione + Registro Imprese",
        economicPotential: 2_900_000,
        opportunityScore: 85,
        suggestedStakeholders: ["ETS_IMPLEMENTER", "PA_VALIDATOR", "BANK_PROMOTER", "ANCHOR_COMPANY"],
        status: "CONVERTED",
        createdBy: luca.id,
      },
      {
        title: "Caregiving di prossimità — Napoli Est",
        description:
          "Rapporto anziani/caregiver in crescita 3x più veloce della media: un ex asilo comunale può ospitare un hub di cura condiviso con badanti formate.",
        territory: "Campania",
        commune: "Napoli",
        gravity: 9,
        populationTarget: "Anziani non autosufficienti + famiglie caregiver",
        assets: "Ex asilo comunale + rete parrocchiale",
        source: "ISTAT BES + bandi regionali",
        economicPotential: 2_700_000,
        opportunityScore: 88,
        suggestedStakeholders: ["ETS_IMPLEMENTER", "ANCHOR_COMPANY", "BANK_PROMOTER"],
        status: "CONVERTED",
        createdBy: luca.id,
      },
      {
        title: "Turismo lento Appennino Tosco-Emiliano",
        description:
          "12 comuni sotto i 5.000 abitanti con rifugi e sentieri CAI sotto-utilizzati: la Via Francigena come infrastruttura di sviluppo locale.",
        territory: "Emilia-Romagna",
        commune: "Berceto",
        gravity: 6,
        populationTarget: "Comuni montani < 5.000 abitanti",
        assets: "Rifugi e sentieristica CAI + 2 ostelli",
        source: "Bandi regionali + OpenCoesione",
        economicPotential: 1_800_000,
        opportunityScore: 71,
        suggestedStakeholders: ["FUND_MANAGER", "PA_VALIDATOR", "ETS_IMPLEMENTER"],
        status: "CONVERTED",
        createdBy: luca.id,
      },
      {
        title: "Agricoltura idroponica sociale — Tavoliere",
        description:
          "Serre abbandonate e acqua di processo da recuperare: produzione idroponica con occupazione di migranti regolari e NEET.",
        territory: "Puglia",
        commune: "Foggia",
        gravity: 7,
        populationTarget: "Migranti regolari + NEET rurali",
        assets: "Serre abbandonate 4 ha + impianti fotovoltaici",
        source: "Registro Imprese + ISTAT BES",
        economicPotential: 2_200_000,
        opportunityScore: 76,
        suggestedStakeholders: ["ANCHOR_COMPANY", "FUND_MANAGER", "ETS_IMPLEMENTER"],
        status: "CONVERTED",
        createdBy: luca.id,
      },
    ])
    .returning();
  const [o1, o2, o3, o4, o5, o6] = opps;

  const projects = await db
    .insert(s.projects)
    .values([
      {
        name: "Cooperativa di Comunità Val Fiemme",
        tagline: "Rigenerare i servizi di prossimità contro lo spopolamento",
        description:
          "Riapertura di 3 botteghe storiche, coworking di montagna e servizi di comunità gestiti da una cooperativa di comunità con 4 tipologie di stakeholder.",
        territory: "Trentino-Alto Adige",
        commune: "Cavalese",
        status: "EXECUTION",
        originatorId: giulia.id,
        opportunityId: o1.id,
        sdgTags: ["SDG 8", "SDG 10", "SDG 11"],
        toc: {
          inputs: [
            "Immobile comunale ex macello (comodato 20 anni)",
            "Grant Fondazione Caritro 400k",
            "Competenze di cooperazione di comunità",
            "Coalizione con 4 tipologie di stakeholder",
          ],
          activities: [
            "Ristrutturazione botteghe e spazi coworking",
            "Formazione di 12 giovani gestori",
            "Partenariato con APT per il turismo lento",
          ],
          outputs: ["3 botteghe riaperte", "1 coworking da 20 postazioni", "12 giovani formati"],
          outcomes: ["24 imprese locali servite", "12 FTE stabili", "Presenze turistiche +38%"],
          impacts: [
            "Saldo migratorio giovanile in pareggio entro 5 anni",
            "Riduzione della povertà educativa di comunità",
            "Filiera corta bosco-legno attivata",
          ],
          validated: true,
        },
        impactCanvas: {
          costStructure: ["Ristrutturazione 320k", "Personale 240k/anno", "Attrezzature 110k"],
          revenueStreams: [
            "Affitti botteghe (80k/anno)",
            "Coworking membership (45k/anno)",
            "Servizi APT (60k/anno)",
            "Contributo comunale servizi (35k/anno)",
          ],
          payingBeneficiaries: "Imprese locali e visitatori (prezzi di mercato)",
          nonPayingBeneficiaries: "Famiglie a basso reddito (servizi gratuiti)",
          keyPartners: ["Comune di Cavalese", "APT Val di Fiemme", "Consorzio Artigiani Fiemme"],
          keyResources: ["Immobile comunale", "Comunità locale attiva", "Rete commerciale storica"],
        },
        raci: [
          { wp: "Ristrutturazione", r: "Coop. Radici", a: "Comune di Cavalese", c: "Anchor", i: "Comunità" },
          { wp: "Formazione giovani", r: "Coop. Radici", a: "Coop. Radici", c: "APT", i: "Banca" },
          { wp: "Gestione botteghe", r: "Coop. di Comunità", a: "Coop. di Comunità", c: "Anchor", i: "Comune" },
        ],
        fundingNeed: 1_350_000,
        annualRevenue: 620_000,
        annualOpex: 320_000,
        localSupplierPct: 64,
        lm3: 0.78,
        fteCreated: 18,
        creditScore: 72,
        impactScore: 84,
        taxonomyAlignmentPct: 76,
        sfdrCategory: "Article 8",
        dnshOk: true,
        expectedLossPct: 1.8,
        sroi: 1.24,
      },
      {
        name: "CER Ceraso — Energia condivisa",
        tagline: "Comunità energetica contro la povertà energetica",
        description:
          "Comunità Energetica Rinnovabile con 2.500 soci cittadini: autoconsumo collettivo su coperture comunali e scolastiche del Cilento interno.",
        territory: "Campania",
        commune: "Ceraso",
        status: "MRV_MONITORING",
        originatorId: giulia.id,
        opportunityId: o2.id,
        sdgTags: ["SDG 7", "SDG 13", "SDG 1"],
        toc: {
          inputs: ["Coperture comunali 12.000 mq", "Grant PNRR 300k", "2.500 soci fondatori"],
          activities: ["Installazione fotovoltaico 900 kWp", "Costituzione CER", "Campagna soci popolare"],
          outputs: ["900 kWp installati", "CER giuridicamente operativa", "2.500 famiglie socie"],
          outcomes: ["96 famiglie fuori dalla povertà energetica", "Autoconsumo collettivo attivo"],
          impacts: ["-35% costo bolletta famiglie fragili", "Comunità energeticamente autonoma"],
          validated: true,
        },
        impactCanvas: {
          costStructure: ["Impianti 700k", "Gestione CER 60k/anno", "Manutenzione 25k/anno"],
          revenueStreams: ["Incentivi GSE autoconsumo (95k/anno)", "Vendita energia residua (40k/anno)"],
          payingBeneficiaries: "Famiglie socie (tariffa agevolata)",
          nonPayingBeneficiaries: "Famiglie in povertà energetica (quota gratuita)",
          keyPartners: ["Comune di Ceraso", "GSE", "Banca del Cilento"],
          keyResources: ["Coperture pubbliche", "Soci attivi"],
        },
        raci: [
          { wp: "Installazione impianti", r: "Coop. Energia Popolare", a: "Anchor", c: "Comune", i: "Comunità" },
          { wp: "Gestione CER", r: "Coop. Energia Popolare", a: "Coop. Energia Popolare", c: "GSE", i: "Banca" },
        ],
        fundingNeed: 1_100_000,
        annualRevenue: 480_000,
        annualOpex: 260_000,
        localSupplierPct: 71,
        lm3: 0.74,
        fteCreated: 6,
        creditScore: 68,
        impactScore: 88,
        taxonomyAlignmentPct: 82,
        sfdrCategory: "Article 9",
        dnshOk: true,
        expectedLossPct: 1.5,
        sroi: 1.83,
      },
      {
        name: "Scuola dei Mestieri Digitali",
        tagline: "NEET del quartiere Tamburi verso l'occupazione tech",
        description:
          "Scuola di formazione digitale in una scuola dismessa: 150 NEET formati con outcome payment della PA (SIB) su 60 inserimenti verificati.",
        territory: "Puglia",
        commune: "Taranto",
        status: "FUNDING_COMMITTED",
        originatorId: giulia.id,
        opportunityId: o3.id,
        sdgTags: ["SDG 4", "SDG 8", "SDG 10"],
        toc: {
          inputs: ["Scuola dismessa (concessione 15 anni)", "Grant Fondazione con il Sud 500k", "Distretto IT locale"],
          activities: ["Corsi coding + AI applicata", "Percorsi di inserimento con aziende", "Certificazione competenze"],
          outputs: ["150 NEET formati", "60 inserimenti lavorativi", "150 certificazioni rilasciate"],
          outcomes: ["Tasso NEET quartiere -30%", "Reddito stabile per 60 famiglie"],
          impacts: ["Abbandono scolastico in calo strutturale", "Polo educativo di eccellenza al Sud"],
          validated: true,
        },
        impactCanvas: {
          costStructure: ["Ristrutturazione 350k", "Docenti 220k/anno", "Borse di studio 90k/anno"],
          revenueStreams: ["SIB outcome payment (200k)", "Contributi aziende partner (80k/anno)", "Bandi formazione (60k/anno)"],
          payingBeneficiaries: "Aziende che assumono (placement fee)",
          nonPayingBeneficiaries: "NEET del quartiere (gratuito)",
          keyPartners: ["Comune di Taranto", "Distretto IT Puglia", "Banca Intesa Sud"],
          keyResources: ["Immobile scolastico", "Docenti certificati", "Network aziende"],
        },
        raci: [
          { wp: "Formazione", r: "Ass. Futuro Taranto", a: "Ass. Futuro Taranto", c: "Distretto IT", i: "Comune" },
          { wp: "Inserimento lavorativo", r: "Distretto IT", a: "Anchor", c: "Comune", i: "Fondo" },
        ],
        fundingNeed: 1_200_000,
        annualRevenue: 540_000,
        annualOpex: 380_000,
        localSupplierPct: 58,
        lm3: 0.66,
        fteCreated: 4,
        creditScore: 74,
        impactScore: 79,
        taxonomyAlignmentPct: 64,
        sfdrCategory: "Article 8",
        dnshOk: true,
        expectedLossPct: 1.9,
        sroi: 1.41,
      },
      {
        name: "Care Hub Napoli Est",
        tagline: "Un hub di cura condiviso per famiglie caregiver",
        description:
          "Ex asilo comunale trasformato in hub di caregiving di prossimità: badanti formate e contrattualizzate, sollievo alle famiglie caregiver.",
        territory: "Campania",
        commune: "Napoli",
        status: "STRUCTURED",
        originatorId: giulia.id,
        opportunityId: o4.id,
        sdgTags: ["SDG 3", "SDG 8", "SDG 5"],
        toc: {
          inputs: ["Ex asilo comunale (comodato)", "Grant Fondazione Cariparo 250k", "Rete parrocchiale"],
          activities: ["Ristrutturazione hub", "Formazione 80 badanti", "Servizi di sollievo domiciliare"],
          outputs: ["1 hub operativo", "80 badanti formate", "12.000 ore di sollievo/anno"],
          outcomes: ["200 anziani assistiti", "80 contratti regolari"],
          impacts: ["Famiglie caregiver sostenute", "Lavoro nero ridotto nel settore cura"],
          validated: true,
        },
        impactCanvas: {
          costStructure: ["Ristrutturazione 280k", "Personale 190k/anno", "Formazione 40k/anno"],
          revenueStreams: ["Servizi domiciliari (150k/anno)", "Convenzione ASL (120k/anno)"],
          payingBeneficiaries: "Famiglie a reddito medio (tariffa sociale)",
          nonPayingBeneficiaries: "Anziani soli ISEE basso",
          keyPartners: ["ASL Napoli 1", "Fondazione San Gennaro", "Banca Prossima"],
          keyResources: ["Immobile comunale", "Badanti certificate"],
        },
        raci: [{ wp: "Gestione hub", r: "Coop. Cura la Città", a: "Coop. Cura la Città", c: "ASL", i: "Fondazione" }],
        fundingNeed: 1_000_000,
        annualRevenue: 420_000,
        annualOpex: 290_000,
        localSupplierPct: 66,
        lm3: 0.72,
        fteCreated: 0,
        creditScore: 64,
        impactScore: 76,
        taxonomyAlignmentPct: 71,
        sfdrCategory: "Article 8",
        dnshOk: true,
        expectedLossPct: 0,
        sroi: 0,
      },
      {
        name: "Via Francigena dell'Appennino",
        tagline: "Turismo lento come infrastruttura di sviluppo",
        description:
          "Rete di 12 comuni dell'Appennino Tosco-Emiliano: accoglienza diffusa, rifugi e servizi lungo la Via Francigena.",
        territory: "Emilia-Romagna",
        commune: "Berceto",
        status: "CO_DESIGN",
        originatorId: giulia.id,
        opportunityId: o5.id,
        sdgTags: ["SDG 8", "SDG 11"],
        toc: {
          inputs: ["Sentieristica CAI esistente", "2 ostelli comunali", "Bando Regione ER 200k"],
          activities: ["Rete di accoglienza diffusa", "Segnaletica e manutenzione", "Pacchetti turismo lento"],
          outputs: ["12 comuni di tappa attivati", "25.000 camminatori/anno"],
          outcomes: ["Economia montana rivitalizzata"],
          impacts: ["Comuni montani ripopolati"],
          validated: false,
        },
        impactCanvas: {
          costStructure: ["Manutenzione 60k/anno", "Marketing 30k/anno"],
          revenueStreams: ["Ospitalità diffusa (120k/anno)"],
          payingBeneficiaries: "Camminatori",
          nonPayingBeneficiaries: "Comunità locali (beneficio indiretto)",
          keyPartners: ["Regione ER", "CAI", "Fondo Meridiano"],
          keyResources: ["Sentieristica", "Ostelli"],
        },
        raci: [],
        fundingNeed: 600_000,
        annualRevenue: 180_000,
        annualOpex: 140_000,
        localSupplierPct: 78,
        lm3: 0.8,
        fteCreated: 0,
        creditScore: 0,
        impactScore: 0,
        taxonomyAlignmentPct: 0,
        sfdrCategory: "Article 6",
        dnshOk: false,
        expectedLossPct: 0,
        sroi: 0,
      },
      {
        name: "AgriH2O — Idroponica Sociale",
        tagline: "Serre abbandonate e lavoro per migranti regolari",
        description:
          "Produzione idroponica in serre recuperate con recupero acqua di processo: 45 posti di lavoro per migranti regolari e NEET rurali.",
        territory: "Puglia",
        commune: "Foggia",
        status: "UNDERWRITING",
        originatorId: giulia.id,
        opportunityId: o6.id,
        sdgTags: ["SDG 2", "SDG 6", "SDG 8"],
        toc: {
          inputs: ["Serre abbandonate 4 ha", "PSR Puglia 300k", "Anchor Ortocoltura"],
          activities: ["Riconversione serre in idroponica", "Formazione operatori agricoli", "Recupero acqua di processo"],
          outputs: ["4 ha in produzione", "45 occupati", "80% acqua recuperata"],
          outcomes: ["Filiera orticola locale rafforzata"],
          impacts: ["Inclusione lavorativa strutturale nel Tavoliere"],
          validated: true,
        },
        impactCanvas: {
          costStructure: ["Riconversione serre 380k", "Personale 210k/anno"],
          revenueStreams: ["Vendita ortaggi (240k/anno)", "Contratto GDO locale (120k/anno)"],
          payingBeneficiaries: "GDO e ristorazione",
          nonPayingBeneficiaries: "Mense sociali (quota donata)",
          keyPartners: ["Ortocoltura Foggia", "Banca del Mezzogiorno", "Coop. Nuova Terra"],
          keyResources: ["Serre", "Impianti fotovoltaici", "Manodopera formata"],
        },
        raci: [{ wp: "Produzione", r: "Coop. Nuova Terra", a: "Anchor", c: "GDO", i: "Banca" }],
        fundingNeed: 1_050_000,
        annualRevenue: 610_000,
        annualOpex: 430_000,
        localSupplierPct: 62,
        lm3: 0.69,
        fteCreated: 0,
        creditScore: 55,
        impactScore: 42,
        taxonomyAlignmentPct: 78,
        sfdrCategory: "Article 8",
        dnshOk: true,
        expectedLossPct: 3.2,
        sroi: 0,
      },
    ])
    .returning();
  const [p1, p2, p3, p4, p5, p6] = projects;

  await db.insert(s.stakeholders).values([
    { projectId: p1.id, userId: andrea.id, type: "ANCHOR_COMPANY", orgName: "Consorzio Elettrico Trentino", contactName: "Andrea Colombo", commitment: "Asset energetici + domanda locale", commitmentValue: 200_000 },
    { projectId: p1.id, userId: enzo.id, type: "BANK_PROMOTER", orgName: "Banca Etica Nordest", contactName: "Enzo Bianchi", commitment: "Senior debt 600k", commitmentValue: 600_000 },
    { projectId: p1.id, userId: elena.id, type: "ETS_IMPLEMENTER", orgName: "Coop. Sociale Radici", contactName: "Elena Rossi", commitment: "Gestione operativa e formazione", commitmentValue: 0 },
    { projectId: p1.id, userId: maria.id, type: "COMMUNITY_VALIDATOR", orgName: "Comunità Val Fiemme", contactName: "Maria Serra", commitment: "Voto ponderato sui servizi", commitmentValue: 0 },
    { projectId: p1.id, userId: paolo.id, type: "PA_VALIDATOR", orgName: "Comune di Cavalese", contactName: "Paolo Greco", commitment: "Comodato immobile + servizi", commitmentValue: 0 },
    { projectId: p2.id, userId: andrea.id, type: "ANCHOR_COMPANY", orgName: "Consorzio Energie Rinnovabili Cilento", commitment: "Impianti + domanda energia", commitmentValue: 150_000 },
    { projectId: p2.id, userId: enzo.id, type: "BANK_PROMOTER", orgName: "Banca del Cilento", commitment: "Senior debt 500k", commitmentValue: 500_000 },
    { projectId: p2.id, userId: elena.id, type: "ETS_IMPLEMENTER", orgName: "Coop. Energia Popolare", commitment: "Gestione CER", commitmentValue: 0 },
    { projectId: p2.id, userId: maria.id, type: "COMMUNITY_VALIDATOR", orgName: "Comunità di Ceraso", commitment: "2.500 soci sottoscrittori", commitmentValue: 100_000 },
    { projectId: p3.id, userId: elena.id, type: "ETS_IMPLEMENTER", orgName: "Associazione Futuro Taranto", commitment: "Formazione e orientamento", commitmentValue: 0 },
    { projectId: p3.id, userId: paolo.id, type: "PA_VALIDATOR", orgName: "Comune di Taranto", commitment: "SIB outcome payment 200k", commitmentValue: 200_000 },
    { projectId: p3.id, userId: enzo.id, type: "BANK_PROMOTER", orgName: "Banca Intesa Sud", commitment: "Senior debt 400k", commitmentValue: 400_000 },
    { projectId: p3.id, userId: andrea.id, type: "ANCHOR_COMPANY", orgName: "Consorzio Digitale Puglia", commitment: "Placement + attrezzature", commitmentValue: 100_000 },
    { projectId: p4.id, userId: elena.id, type: "ETS_IMPLEMENTER", orgName: "Coop. Cura la Città", commitment: "Gestione hub", commitmentValue: 0 },
    { projectId: p4.id, userId: andrea.id, type: "ANCHOR_COMPANY", orgName: "Fondazione San Gennaro", commitment: "Comodato + rete territoriale", commitmentValue: 0 },
    { projectId: p4.id, userId: enzo.id, type: "BANK_PROMOTER", orgName: "Banca Prossima", commitment: "Senior debt 450k", commitmentValue: 450_000 },
    { projectId: p5.id, userId: sofia.id, type: "FUND_MANAGER", orgName: "Fondo Meridiano", commitment: "Due diligence pilota", commitmentValue: 50_000 },
    { projectId: p5.id, userId: paolo.id, type: "PA_VALIDATOR", orgName: "Regione Emilia-Romagna", commitment: "Bando turismo lento", commitmentValue: 200_000 },
    { projectId: p5.id, userId: elena.id, type: "ETS_IMPLEMENTER", orgName: "Associazione Sentieri d'Appennino", commitment: "Gestione rete accoglienza", commitmentValue: 0 },
    { projectId: p6.id, userId: andrea.id, type: "ANCHOR_COMPANY", orgName: "Ortocoltura Foggia", commitment: "Serre + equity 100k", commitmentValue: 100_000 },
    { projectId: p6.id, userId: enzo.id, type: "BANK_PROMOTER", orgName: "Banca del Mezzogiorno", commitment: "Senior debt 500k", commitmentValue: 500_000 },
    { projectId: p6.id, userId: elena.id, type: "ETS_IMPLEMENTER", orgName: "Coop. Nuova Terra", commitment: "Inserimento lavorativo", commitmentValue: 0 },
  ]);

  await db.insert(s.tranches).values([
    { projectId: p1.id, instrument: "GRANT", label: "Grant Fondazione Caritro", provider: "Fondazione Caritro", amount: 400_000, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 1, conditions: null, status: "DISBURSED" },
    { projectId: p1.id, instrument: "CONCESSIONAL_LOAN", label: "Prestito agevolato", provider: "Cassa Rurale Fiemme", amount: 150_000, ratePct: 2, maturityMonths: 84, guaranteePct: 0, waterfallOrder: 2, conditions: null, status: "DISBURSED" },
    { projectId: p1.id, instrument: "SENIOR_DEBT", label: "Debito senior", provider: "Banca Etica Nordest", amount: 600_000, ratePct: 6.5, maturityMonths: 120, guaranteePct: 80, waterfallOrder: 3, conditions: "Erogazione completata in 2 tranche", status: "DISBURSED" },
    { projectId: p1.id, instrument: "EQUITY", label: "Equity Anchor + Comunità", provider: "Consorzio Elettrico Trentino", amount: 200_000, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 4, conditions: null, status: "DISBURSED" },
    { projectId: p1.id, instrument: "GUARANTEE", label: "Garanzia MCC 80%", provider: "MCC", amount: 480_000, ratePct: 0, maturityMonths: 120, guaranteePct: 80, waterfallOrder: 5, conditions: null, status: "COMMITTED" },
    { projectId: p2.id, instrument: "GRANT", label: "Grant Transizione Energetica", provider: "PNRR / Fondo comuni", amount: 300_000, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 1, conditions: null, status: "DISBURSED" },
    { projectId: p2.id, instrument: "CONCESSIONAL_LOAN", label: "Prestito agevolato CDP", provider: "Cassa Depositi e Prestiti", amount: 200_000, ratePct: 1.8, maturityMonths: 96, guaranteePct: 0, waterfallOrder: 2, conditions: null, status: "DISBURSED" },
    { projectId: p2.id, instrument: "SENIOR_DEBT", label: "Debito senior", provider: "Banca del Cilento", amount: 500_000, ratePct: 5.9, maturityMonths: 108, guaranteePct: 80, waterfallOrder: 3, conditions: null, status: "DISBURSED" },
    { projectId: p2.id, instrument: "COMMUNITY_SHARES", label: "Quote della comunità", provider: "2.500 cittadini soci", amount: 100_000, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 4, conditions: null, status: "DISBURSED" },
    { projectId: p2.id, instrument: "GUARANTEE", label: "Garanzia SACE 80%", provider: "SACE", amount: 400_000, ratePct: 0, maturityMonths: 108, guaranteePct: 80, waterfallOrder: 5, conditions: null, status: "COMMITTED" },
    { projectId: p3.id, instrument: "GRANT", label: "Grant Fondazione con il Sud", provider: "Fondazione con il Sud", amount: 500_000, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 1, conditions: null, status: "COMMITTED" },
    { projectId: p3.id, instrument: "SENIOR_DEBT", label: "Debito senior", provider: "Banca Intesa Sud", amount: 400_000, ratePct: 6.1, maturityMonths: 96, guaranteePct: 80, waterfallOrder: 2, conditions: "kpi:9 >= 60 (erogazione vincolata agli inserimenti verificati)", status: "PROPOSED" },
    { projectId: p3.id, instrument: "SIB", label: "SIB Outcome Payment", provider: "Comune di Taranto", amount: 200_000, ratePct: 0, maturityMonths: 60, guaranteePct: 0, waterfallOrder: 3, conditions: "Outcome verificato da PA: kpi:9 >= 60", status: "COMMITTED" },
    { projectId: p3.id, instrument: "EQUITY", label: "Equity Consorzio Digitale", provider: "Consorzio Digitale Puglia", amount: 100_000, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 4, conditions: null, status: "COMMITTED" },
    { projectId: p3.id, instrument: "GUARANTEE", label: "Garanzia MCC 80%", provider: "MCC", amount: 320_000, ratePct: 0, maturityMonths: 96, guaranteePct: 80, waterfallOrder: 5, conditions: null, status: "COMMITTED" },
    { projectId: p4.id, instrument: "GRANT", label: "Grant Fondazione Cariparo", provider: "Fondazione Cariparo", amount: 250_000, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 1, conditions: null, status: "PROPOSED" },
    { projectId: p4.id, instrument: "CONCESSIONAL_LOAN", label: "Prestito agevolato", provider: "Banca Prossima", amount: 300_000, ratePct: 2.2, maturityMonths: 96, guaranteePct: 0, waterfallOrder: 2, conditions: null, status: "PROPOSED" },
    { projectId: p4.id, instrument: "SENIOR_DEBT", label: "Debito senior", provider: "Banca Prossima", amount: 450_000, ratePct: 6.8, maturityMonths: 120, guaranteePct: 80, waterfallOrder: 3, conditions: "kpi:12 >= 150 (anziani assistiti)", status: "PROPOSED" },
    { projectId: p5.id, instrument: "GRANT", label: "Bando Turismo Lento", provider: "Regione Emilia-Romagna", amount: 200_000, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 1, conditions: null, status: "PROPOSED" },
    { projectId: p6.id, instrument: "GRANT", label: "PSR Puglia Misura 4.2", provider: "Regione Puglia", amount: 300_000, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 1, conditions: null, status: "PROPOSED" },
    { projectId: p6.id, instrument: "CONCESSIONAL_LOAN", label: "Prestito agevolato", provider: "Banca del Mezzogiorno", amount: 150_000, ratePct: 2.5, maturityMonths: 72, guaranteePct: 0, waterfallOrder: 2, conditions: null, status: "PROPOSED" },
    { projectId: p6.id, instrument: "SENIOR_DEBT", label: "Debito senior", provider: "Banca del Mezzogiorno", amount: 500_000, ratePct: 7.1, maturityMonths: 108, guaranteePct: 80, waterfallOrder: 3, conditions: "kpi:17 >= 40 (occupati verificati)", status: "PROPOSED" },
    { projectId: p6.id, instrument: "EQUITY", label: "Equity Anchor", provider: "Ortocoltura Foggia", amount: 100_000, ratePct: 0, maturityMonths: 0, guaranteePct: 0, waterfallOrder: 4, conditions: null, status: "COMMITTED" },
    { projectId: p6.id, instrument: "GUARANTEE", label: "Garanzia MCC 80%", provider: "MCC", amount: 400_000, ratePct: 0, maturityMonths: 108, guaranteePct: 80, waterfallOrder: 5, conditions: null, status: "PROPOSED" },
  ]);

  const kpis = await db
    .insert(s.kpis)
    .values([
      { projectId: p1.id, code: "PI4069", title: "Posti di lavoro stabili creati", unit: "FTE", baseline: 0, target: 15, current: 12, valuePerUnit: 28_000, verificationMethod: "Contratti di assunzione + buste paga", timelineMonths: 24, sdg: "SDG 8" },
      { projectId: p1.id, code: "OI9609", title: "Presenze turistiche annuali", unit: "%", baseline: 0, target: 40, current: 38, valuePerUnit: 3_000, verificationMethod: "Dati APT + tassa di soggiorno", timelineMonths: 24, sdg: "SDG 8" },
      { projectId: p1.id, code: "PI3424", title: "Imprese locali servite", unit: "n.", baseline: 6, target: 30, current: 24, valuePerUnit: 6_000, verificationMethod: "Registro contratti B2B", timelineMonths: 24, sdg: "SDG 11" },
      { projectId: p1.id, code: "PI5245", title: "Saldo migratorio giovanile 18-35", unit: "saldo %", baseline: -14, target: 0, current: -6, valuePerUnit: 20_000, verificationMethod: "Anagrafe comunale", timelineMonths: 36, sdg: "SDG 10" },
      { projectId: p2.id, code: "PI1309", title: "Famiglie in povertà energetica servite", unit: "n.", baseline: 0, target: 120, current: 96, valuePerUnit: 1_200, verificationMethod: "Attestazione ISEE + letture smart meter", timelineMonths: 24, sdg: "SDG 7" },
      { projectId: p2.id, code: "PI1794", title: "Energia rinnovabile condivisa", unit: "MWh/anno", baseline: 0, target: 400, current: 210, valuePerUnit: 150, verificationMethod: "Dati GSE autoconsumo collettivo", timelineMonths: 24, sdg: "SDG 7" },
      { projectId: p2.id, code: "PI9913", title: "CO2 evitata", unit: "t/anno", baseline: 0, target: 350, current: 185, valuePerUnit: 120, verificationMethod: "Fattori di emissione ISPRA", timelineMonths: 24, sdg: "SDG 13" },
      { projectId: p3.id, code: "PI4871", title: "NEET formati", unit: "n.", baseline: 0, target: 150, current: 40, valuePerUnit: 8_000, verificationMethod: "Registro corsi + attestati", timelineMonths: 24, sdg: "SDG 4" },
      { projectId: p3.id, code: "PI8835", title: "Inserimenti lavorativi", unit: "n.", baseline: 0, target: 60, current: 8, valuePerUnit: 30_000, verificationMethod: "Buste paga (API anonimizzate)", timelineMonths: 24, sdg: "SDG 8" },
      { projectId: p3.id, code: "PI5658", title: "Certificazioni competenze rilasciate", unit: "n.", baseline: 0, target: 150, current: 40, valuePerUnit: 1_500, verificationMethod: "Registro certificazioni", timelineMonths: 24, sdg: "SDG 4" },
      { projectId: p3.id, code: "PI2824", title: "Abbandono scolastico nel quartiere", unit: "%", baseline: 18, target: 10, current: 17.5, valuePerUnit: 50_000, verificationMethod: "Dati MIUR + anagrafe studenti", timelineMonths: 36, sdg: "SDG 4" },
      { projectId: p4.id, code: "PI1333", title: "Anziani non autosufficienti assistiti", unit: "n.", baseline: 0, target: 200, current: 0, valuePerUnit: 8_000, verificationMethod: "Cartelle sociali ASL", timelineMonths: 24, sdg: "SDG 3" },
      { projectId: p4.id, code: "PI5540", title: "Badanti formate e contrattualizzate", unit: "n.", baseline: 0, target: 80, current: 0, valuePerUnit: 25_000, verificationMethod: "Contratti di lavoro regolari", timelineMonths: 24, sdg: "SDG 8" },
      { projectId: p4.id, code: "PI8891", title: "Ore di sollievo alle famiglie", unit: "ore", baseline: 0, target: 12_000, current: 0, valuePerUnit: 5, verificationMethod: "Timesheet + firme digitali", timelineMonths: 24, sdg: "SDG 3" },
      { projectId: p5.id, code: "PI7001", title: "Comuni di tappa attivati", unit: "n.", baseline: 0, target: 12, current: 0, valuePerUnit: 40_000, verificationMethod: "Convenzioni comunali", timelineMonths: 18, sdg: "SDG 11" },
      { projectId: p5.id, code: "PI7012", title: "Camminatori annuali", unit: "n.", baseline: 0, target: 25_000, current: 0, valuePerUnit: 2, verificationMethod: "Contatori sentiero + credenziali", timelineMonths: 18, sdg: "SDG 8" },
      { projectId: p6.id, code: "PI2031", title: "Migranti e NEET occupati", unit: "n.", baseline: 0, target: 45, current: 12, valuePerUnit: 28_000, verificationMethod: "Buste paga (API anonimizzate)", timelineMonths: 24, sdg: "SDG 8" },
      { projectId: p6.id, code: "PI8312", title: "Tonnellate ortaggi/anno", unit: "t", baseline: 0, target: 180, current: 50, valuePerUnit: 1_500, verificationMethod: "Registri di produzione", timelineMonths: 24, sdg: "SDG 2" },
      { projectId: p6.id, code: "PI5198", title: "Acqua di processo recuperata", unit: "%", baseline: 20, target: 80, current: 40, valuePerUnit: 2_000, verificationMethod: "Contatori di flusso IoT", timelineMonths: 24, sdg: "SDG 6" },
    ])
    .returning();
  const [k1, k2, k3, k4, k5, k6, k7, k8, k9, k10, k11, k12, k13, k14, k15, k16, k17, k18, k19] = kpis;

  const evidences = await db
    .insert(s.evidences)
    .values([
      { kpiId: k1.id, title: "Buste paga — ciclo 12 mesi (anonimizzate)", type: "API_PAYROLL", value: 12, fileRef: "payroll-valfiemme-12m.csv", status: "APPROVED", submittedBy: elena.id, validatedBy: franco.id, validatorNote: "Coerenti con i contratti registrati in cooperativa.", validatedAt: new Date("2026-07-22T09:15:00Z"), submittedAt: new Date("2026-07-20T14:30:00Z") },
      { kpiId: k2.id, title: "Report APT semestre — presenze", type: "DOCUMENT", value: 38, fileRef: "apt-report-h1-2026.pdf", status: "APPROVED", submittedBy: elena.id, validatedBy: franco.id, validatorNote: "Confronto con tassa di soggiorno: dati allineati.", validatedAt: new Date("2026-07-25T10:00:00Z"), submittedAt: new Date("2026-07-23T16:45:00Z") },
      { kpiId: k3.id, title: "Contratti B2B firmati", type: "DOCUMENT", value: 24, fileRef: "contratti-b2b.zip", status: "APPROVED", submittedBy: elena.id, validatedBy: franco.id, validatorNote: "Verificati a campione (8/24).", validatedAt: new Date("2026-07-28T11:20:00Z"), submittedAt: new Date("2026-07-26T09:10:00Z") },
      { kpiId: k4.id, title: "Movimenti anagrafici comunali", type: "DOCUMENT", value: 8, fileRef: "anagrafe-cavalese.pdf", status: "PENDING", submittedBy: elena.id, submittedAt: new Date("2026-08-05T08:30:00Z") },
      { kpiId: k5.id, title: "Attestazioni ISEE + smart meter", type: "API_PAYROLL", value: 96, fileRef: "isee-smartmeter.csv", status: "APPROVED", submittedBy: elena.id, validatedBy: franco.id, validatorNote: "Pseudoanonimizzate correttamente (GDPR ok).", validatedAt: new Date("2026-07-30T15:00:00Z"), submittedAt: new Date("2026-07-28T10:00:00Z") },
      { kpiId: k6.id, title: "Flussi GSE mensili", type: "IOT", value: 210, fileRef: "gse-flows.json", status: "APPROVED", submittedBy: elena.id, validatedBy: franco.id, validatorNote: "Stream IoT firmato dal meter gateway.", validatedAt: new Date("2026-08-01T09:00:00Z"), submittedAt: new Date("2026-07-31T18:00:00Z") },
      { kpiId: k7.id, title: "Calcolo ISPRA CO2 evitata", type: "DOCUMENT", value: 185, fileRef: "ispra-co2.pdf", status: "PENDING", submittedBy: elena.id, submittedAt: new Date("2026-08-04T12:00:00Z") },
      { kpiId: k6.id, title: "Survey famiglie — sentiment", type: "SURVEY", value: 4.6, fileRef: "survey-famiglie.json", status: "PENDING", submittedBy: maria.id, submittedAt: new Date("2026-08-06T17:30:00Z") },
      { kpiId: k8.id, title: "Report formazione modulo 1", type: "DOCUMENT", value: 40, fileRef: "report-modulo1.pdf", status: "APPROVED", submittedBy: elena.id, validatedBy: franco.id, validatorNote: "Attestati registrati nel sistema regionale.", validatedAt: new Date("2026-08-02T10:30:00Z"), submittedAt: new Date("2026-07-30T09:00:00Z") },
      { kpiId: k9.id, title: "Buste paga — primi 8 inserimenti", type: "API_PAYROLL", value: 8, fileRef: "payroll-taranto-8.csv", status: "APPROVED", submittedBy: elena.id, validatedBy: franco.id, validatorNote: "8 contratti verificati con aziende partner.", validatedAt: new Date("2026-08-03T14:00:00Z"), submittedAt: new Date("2026-08-01T11:00:00Z") },
      { kpiId: k9.id, title: "Verbale commissione lavoro", type: "DOCUMENT", value: 6, fileRef: "verbale-cl.pdf", status: "REJECTED", submittedBy: elena.id, validatedBy: franco.id, validatorNote: "Duplicato: gli stessi inserimenti risultano già dalle buste paga.", validatedAt: new Date("2026-08-05T09:45:00Z"), submittedAt: new Date("2026-08-04T16:00:00Z") },
      { kpiId: k17.id, title: "Sopralluogo serre — flussi acqua", type: "IOT", value: 40, fileRef: "iot-serragrih2o.json", status: "PENDING", submittedBy: elena.id, submittedAt: new Date("2026-08-07T08:15:00Z") },
    ])
    .returning();
  const [e1] = evidences;

  await db.insert(s.walletTransactions).values([
    { projectId: p1.id, type: "COMMITMENT", fromEntity: "Fondazione Caritro", toEntity: "Coop. di Comunità Val Fiemme", amount: 400_000, note: "Commitment grant", hash: "0x9f3a2c1d8e4b7a5f", date: new Date("2026-02-10T10:00:00Z") },
    { projectId: p1.id, type: "COMMITMENT", fromEntity: "Cassa Rurale Fiemme", toEntity: "Coop. di Comunità Val Fiemme", amount: 150_000, note: "Commitment prestito agevolato", hash: "0x7d1e9b4c6a2f8e3d", date: new Date("2026-02-12T10:00:00Z") },
    { projectId: p1.id, type: "DISBURSEMENT", fromEntity: "Banca Etica Nordest", toEntity: "Coop. di Comunità Val Fiemme", amount: 600_000, note: "Erogazione senior debt", hash: "0x3c8f5a2d9e7b1c4f", date: new Date("2026-03-01T09:30:00Z") },
    { projectId: p1.id, type: "EXPENSE", fromEntity: "Coop. di Comunità Val Fiemme", toEntity: "Consorzio Artigiani Fiemme", amount: 85_000, note: "Ristrutturazione botteghe (fornitore locale)", hash: "0x1a6b9e3d7c2f5a8b", evidenceId: e1.id, date: new Date("2026-04-15T14:00:00Z") },
    { projectId: p1.id, type: "OUTCOME_VERIFICATION", fromEntity: "MRV Engine", toEntity: "Wallet d'impatto", amount: 12, note: "12 outcome verificati → token coniati", hash: "0xe5c3a1f9b7d2e4c6", date: new Date("2026-07-22T09:20:00Z") },
    { projectId: p2.id, type: "COMMITMENT", fromEntity: "PNRR Fondo Comuni", toEntity: "CER Ceraso", amount: 300_000, note: "Grant transizione energetica", hash: "0x8b2d7f4a1c9e6b3d", date: new Date("2025-11-20T10:00:00Z") },
    { projectId: p2.id, type: "DISBURSEMENT", fromEntity: "Banca del Cilento", toEntity: "CER Ceraso", amount: 500_000, note: "Erogazione senior debt", hash: "0x5e9a3c7b1d4f8e2a", date: new Date("2026-01-15T09:00:00Z") },
    { projectId: p2.id, type: "EXPENSE", fromEntity: "CER Ceraso", toEntity: "SolarTech Cilento", amount: 240_000, note: "Installazione fotovoltaico (fornitore locale)", hash: "0x2f7c1e9a4b8d3f5c", date: new Date("2026-03-10T11:00:00Z") },
    { projectId: p2.id, type: "OUTCOME_VERIFICATION", fromEntity: "MRV Engine", toEntity: "Wallet d'impatto", amount: 96, note: "96 famiglie verificate → token coniati", hash: "0xb4e8d2f6a1c7e9b3", date: new Date("2026-07-30T15:05:00Z") },
    { projectId: p3.id, type: "COMMITMENT", fromEntity: "Fondazione con il Sud", toEntity: "Scuola dei Mestieri", amount: 500_000, note: "Commitment grant", hash: "0x6c1f8e3b5a9d2e7f", date: new Date("2026-06-18T10:00:00Z") },
    { projectId: p3.id, type: "COMMITMENT", fromEntity: "Comune di Taranto", toEntity: "Scuola dei Mestieri", amount: 200_000, note: "SIB outcome payment riservato", hash: "0x9d4a7e2c6f1b8e3a", date: new Date("2026-06-20T10:00:00Z") },
    { projectId: p6.id, type: "COMMITMENT", fromEntity: "Ortocoltura Foggia", toEntity: "AgriH2O", amount: 100_000, note: "Equity anchor", hash: "0x3e7b1c5f9a2d8e4b", date: new Date("2026-07-05T10:00:00Z") },
  ]);

  await db.insert(s.impactTokens).values([
    { projectId: p1.id, kpiId: k1.id, amount: 12, description: "1 token = 1 inserimento lavorativo verificato", issuedAt: new Date("2026-07-22T09:20:00Z") },
    { projectId: p2.id, kpiId: k5.id, amount: 96, description: "1 token = 1 famiglia fuori dalla povertà energetica", issuedAt: new Date("2026-07-30T15:05:00Z") },
  ]);

  await db.insert(s.documents).values([
    { projectId: p1.id, title: "Term Sheet strutturato", category: "TERM_SHEET", sizeKb: 340, status: "SIGNED", uploadedBy: enzo.id, uploadedAt: new Date("2026-02-20T10:00:00Z") },
    { projectId: p1.id, title: "Accordo di co-finanziamento", category: "CONTRACT", sizeKb: 520, status: "SIGNED", uploadedBy: giulia.id, uploadedAt: new Date("2026-02-25T10:00:00Z") },
    { projectId: p1.id, title: "Garanzia MCC 80%", category: "CONTRACT", sizeKb: 410, status: "SIGNED", uploadedBy: enzo.id, uploadedAt: new Date("2026-02-28T10:00:00Z") },
    { projectId: p1.id, title: "Statuto cooperativa di comunità", category: "LEGAL", sizeKb: 280, status: "SIGNED", uploadedBy: giulia.id, uploadedAt: new Date("2026-03-05T10:00:00Z") },
    { projectId: p1.id, title: "Dichiarazione DNSH", category: "LEGAL", sizeKb: 190, status: "SIGNED", uploadedBy: enzo.id, uploadedAt: new Date("2026-03-08T10:00:00Z") },
    { projectId: p1.id, title: "Bilancio d'impatto 2025", category: "FINANCIAL", sizeKb: 720, status: "DRAFT", uploadedBy: elena.id, uploadedAt: new Date("2026-08-01T10:00:00Z") },
    { projectId: p2.id, title: "Term Sheet strutturato", category: "TERM_SHEET", sizeKb: 310, status: "SIGNED", uploadedBy: enzo.id, uploadedAt: new Date("2025-11-10T10:00:00Z") },
    { projectId: p2.id, title: "Contratto CER GSE", category: "CONTRACT", sizeKb: 450, status: "SIGNED", uploadedBy: elena.id, uploadedAt: new Date("2025-12-01T10:00:00Z") },
    { projectId: p2.id, title: "Accordo di co-finanziamento", category: "CONTRACT", sizeKb: 380, status: "SIGNED", uploadedBy: giulia.id, uploadedAt: new Date("2025-12-05T10:00:00Z") },
    { projectId: p2.id, title: "Report GSE semestrale", category: "FINANCIAL", sizeKb: 540, status: "DRAFT", uploadedBy: elena.id, uploadedAt: new Date("2026-07-20T10:00:00Z") },
    { projectId: p3.id, title: "Term Sheet strutturato", category: "TERM_SHEET", sizeKb: 350, status: "SIGNED", uploadedBy: enzo.id, uploadedAt: new Date("2026-06-25T10:00:00Z") },
    { projectId: p3.id, title: "SIB Agreement — Comune di Taranto", category: "CONTRACT", sizeKb: 480, status: "SIGNED", uploadedBy: paolo.id, uploadedAt: new Date("2026-06-28T10:00:00Z") },
    { projectId: p3.id, title: "Garanzia MCC 80%", category: "CONTRACT", sizeKb: 390, status: "SIGNED", uploadedBy: enzo.id, uploadedAt: new Date("2026-06-30T10:00:00Z") },
    { projectId: p3.id, title: "Dichiarazione DNSH", category: "LEGAL", sizeKb: 180, status: "SIGNED", uploadedBy: enzo.id, uploadedAt: new Date("2026-07-01T10:00:00Z") },
    { projectId: p4.id, title: "Term Sheet in bozza", category: "TERM_SHEET", sizeKb: 260, status: "DRAFT", uploadedBy: enzo.id, uploadedAt: new Date("2026-07-15T10:00:00Z") },
    { projectId: p4.id, title: "Lettera di interesse banche", category: "FINANCIAL", sizeKb: 220, status: "DRAFT", uploadedBy: giulia.id, uploadedAt: new Date("2026-07-18T10:00:00Z") },
    { projectId: p5.id, title: "Bozza accordo di rete", category: "LEGAL", sizeKb: 210, status: "DRAFT", uploadedBy: giulia.id, uploadedAt: new Date("2026-07-30T10:00:00Z") },
    { projectId: p6.id, title: "Term Sheet in bozza", category: "TERM_SHEET", sizeKb: 250, status: "DRAFT", uploadedBy: enzo.id, uploadedAt: new Date("2026-07-25T10:00:00Z") },
    { projectId: p6.id, title: "Dossier istruttoria", category: "FINANCIAL", sizeKb: 610, status: "DRAFT", uploadedBy: enzo.id, uploadedAt: new Date("2026-07-28T10:00:00Z") },
  ]);

  await db.insert(s.comments).values([
    { projectId: p1.id, userId: giulia.id, userName: "Giulia Moretti", section: "TOC", text: "Inserito outcome demografico: saldo migratorio giovanile. Serve fonte anagrafica per la baseline.", createdAt: new Date("2026-01-18T10:00:00Z") },
    { projectId: p1.id, userId: elena.id, userName: "Elena Rossi", section: "TOC", text: "Confermo disponibilità degli spazi per le attività formative da settembre.", createdAt: new Date("2026-01-19T09:30:00Z") },
    { projectId: p1.id, userId: enzo.id, userName: "Enzo Bianchi", section: "FINANCE", text: "Garantiamo il senior solo con MCC all'80%: aggiornato il term sheet.", createdAt: new Date("2026-02-15T11:00:00Z") },
    { projectId: p5.id, userId: sofia.id, userName: "Sofia Marchetti", section: "TOC", text: "Prima della DD serve una struttura finanziaria con leva ≥ 2x: mancano 2 tranche.", createdAt: new Date("2026-07-25T14:00:00Z") },
  ]);

  await db.insert(s.auditLog).values([
    { userId: giulia.id, userName: "Giulia Moretti", action: "CREA_FOUNDRY", entityType: "PROJECT", entityId: p1.id, details: "Foundry creato da opportunità radar", timestamp: new Date("2026-01-10T09:00:00Z") },
    { userId: enzo.id, userName: "Enzo Bianchi", action: "AGGIUNGE_TRANCHE", entityType: "PROJECT", entityId: p1.id, details: "Aggiunta tranche Senior Debt 600k", timestamp: new Date("2026-02-12T10:00:00Z") },
    { userId: giulia.id, userName: "Giulia Moretti", action: "AVANZA_STATO", entityType: "PROJECT", entityId: p1.id, details: "CO_DESIGN → STRUCTURED (checklist superata)", timestamp: new Date("2026-02-22T10:00:00Z") },
    { userId: franco.id, userName: "Franco Vitale", action: "VALIDA_EVIDENZA", entityType: "EVIDENCE", entityId: 1, details: "Approvata: buste paga anonimizzate coerenti", timestamp: new Date("2026-07-22T09:15:00Z") },
    { userId: franco.id, userName: "Franco Vitale", action: "VALIDA_EVIDENZA", entityType: "EVIDENCE", entityId: 11, details: "Respinta: duplicato di evidenza già contabilizzata", timestamp: new Date("2026-08-05T09:45:00Z") },
    { userId: elena.id, userName: "Elena Rossi", action: "INVIO_EVIDENZA", entityType: "EVIDENCE", entityId: 12, details: "Caricato stream IoT sopralluogo serre", timestamp: new Date("2026-08-07T08:15:00Z") },
    { userId: giulia.id, userName: "Giulia Moretti", action: "ESEGUE_AGENTE", entityType: "PROJECT", entityId: p6.id, details: "Underwriter Agent: score sotto soglia, 2 rischi flaggati", timestamp: new Date("2026-08-06T16:00:00Z") },
    { userId: marta.id, userName: "Marta Rinaldi", action: "CONFIGURA_TASSONOMIA", entityType: "TENANT", details: "Importata tassonomia IRIS+ v5.3 + EU Taxonomy 2024", timestamp: new Date("2026-08-01T08:00:00Z") },
  ]);

  console.log("✓ Seed completato:", {
    users: users.length,
    opportunities: opps.length,
    projects: projects.length,
    kpis: kpis.length,
    evidences: evidences.length,
  });
}

// Esecuzione diretta: npx tsx src/db/seed.ts
const isMain =
  process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`;
if (isMain) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Seed fallito:", e);
      process.exit(1);
    });
}
