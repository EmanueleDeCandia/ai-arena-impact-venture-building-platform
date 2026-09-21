# Impact Forge — Venture Building OS & Mercato dell'Impatto

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?style=flat-square)](https://orm.drizzle.team/)
[![IMP Framework](https://img.shields.io/badge/Standard-IMP_5_Dimensions-10b981?style=flat-square)](https://impactfrontiers.org/norms/five-dimensions-of-impact/)
[![Design System](https://img.shields.io/badge/UI-3D_Claymorphic_Tactile-dfd7c5?style=flat-square)](#design-system-tattile-3d)

> **Impact Forge** è una piattaforma avanzata di **Impact Venture Building** che trasforma la generazione di impatto sociale e ambientale da costo a fondo perduto in un **asset economico investibile, bancabile e scalabile**. 
> Integrando l'**Impact Management Project (IMP)**, l'architettura di **Blended Finance**, modelli **Pay for Success (PFS)** e principi di **Mechanism Design**, la piattaforma crea le condizioni per un vero e proprio **mercato concorrenziale dell'efficacia e dell'efficienza sociale**.

---

## 📑 Indice dei Contenuti

1. [La Visione: Perché un "Mercato dell'Impatto"?](#1-la-visione-perché-un-mercato-dellimpatto)
2. [Adattamento del Framework IMP: Dalla Teoria alla Pratica](#2-adattamento-del-framework-imp-dalla-teoria-alla-pratica)
   - [Le 5 Dimensioni e le 15 Categorie Dati](#le-5-dimensioni-e-le-15-categorie-dati)
   - [Dati Self-Reported vs Non-Self-Reported](#dati-self-reported-vs-non-self-reported)
   - [Classificazione delle Imprese (BICE Framework: Classi A, B, C)](#classificazione-delle-imprese-bice-framework)
3. [Il Salto di Qualità: Mechanism Design & Cost-Effectiveness](#3-il-salto-di-qualità-mechanism-design--cost-effectiveness)
   - [Superamento dei Limiti dell'IMP Tradizionale](#superamento-dei-limiti-dellimp-tradizionale)
   - [Il Costo per Outcome come Benchmark Competitivo](#il-costo-per-outcome-come-benchmark-competitivo)
   - [Incentivi Allineati per Beneficiari, Attuatori e Investitori](#incentivi-allineati-per-beneficiari-attuatori-e-investitori)
4. [Motore Matematico, Finanziario ed Algoritmico](#4-motore-matematico-finanziario-ed-algoritmico)
   - [Blended Finance & Waterfall di Capitale](#blended-finance--waterfall-di-capitale)
   - [Modelli Pay for Success (PFS) & Social Impact Bond (SIB)](#modelli-pay-for-success-pfs--social-impact-bond-sib)
   - [Condizioni di Sblocco Algoritmiche a Risultato](#condizioni-di-sblocco-algoritmiche-a-risultato)
   - [Valutazione del Credito: Basilea II/III & Expected Loss](#valutazione-del-credito-basilea-iiiii--expected-loss)
5. [Architettura dei 6 Agenti AI Decisionali](#5-architettura-dei-6-agenti-ai-decisionali)
6. [Design System Tattile 3D (Claymorphic)](#6-design-system-tattile-3d-claymorphic)
7. [Stack Tecnologico & Avvio Locale](#7-stack-tecnologico--avvio-locale)
8. [Riferimenti alla Documentazione](#8-riferimenti-alla-documentazione)

---

## 1. La Visione: Perché un "Mercato dell'Impatto"?

Nei modelli tradizionali di welfare e cooperazione sociale:
- **I fondi sono erogati a monte** (tramite contributi a fondo perduto o tariffe standard a prestazione).
- **L'incentivo dell'attuatore è orientato all'assorbimento del budget** (*input-driven*), senza misurare né premiare l'efficacia trasformativa reale.
- **Gli investitori privati sono esclusi o relegati alla beneficenza marginale**, poiché l'impatto non produce rendimenti sostenibili o flussi di cassa affidabili.

**Impact Forge** capovolge questo paradigma: attraverso il **Mechanism Design** (la progettazione formale di regole di gioco e incentivi affinché l'equilibrio di mercato massimizzi il benessere collettivo), la piattaforma trasforma gli outcome sociali in flussi finanziari certi, verificabili e comparabili.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          IL CIRCOLO VIRTUOSO DI IMPACT FORGE                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   [ 1. NEED SENSING ]       Identifica bisogni territoriali insoddisfatti e asset      │
│            │                                                                           │
│            ▼                                                                           │
│   [ 2. CO-DESIGN TOC ]      Struttura la Teoria del Cambiamento e la governance        │
│            │                                                                           │
│            ▼                                                                           │
│   [ 3. IMP ASSESSMENT ]     Valuta le 5 Dimensioni secondo il framework globale        │
│            │                                                                           │
│            ▼                                                                           │
│   [ 4. BLENDED FINANCE ]    Combina Grant, Debito Agevolato, Senior, Garanzie ed Equity│
│            │                                                                           │
│            ▼                                                                           │
│   [ 5. PAY FOR SUCCESS ]    Lega i premi di rendimento a target certificati            │
│            │                                                                           │
│            ▼                                                                           │
│   [ 6. AUDIT & MRV ]        Terza parte indipendente convalida le evidenze primarie    │
│            │                                                                           │
│            ▼                                                                           │
│   [ 7. TOKEN & WALLET ]     Monetizzazione del valore sociale ed erogazione success fee│
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Adattamento del Framework IMP: Dalla Teoria alla Pratica

Il framework internazionale **Impact Management Project (IMP)** (standard globale promosso da oltre 2.000 organizzazioni e coordinato da *Impact Frontiers*) costituisce la colonna portante della valutazione d'impatto di Impact Forge.

### Le 5 Dimensioni e le 15 Categorie Dati

L'applicazione rende interamente compilabile e navigabile la matrice delle 5 dimensioni:

| Dimensione | Significato Operativo | Categorie di Dati IMP Raccolte |
| :--- | :--- | :--- |
| **WHAT** | Quali esiti (outcome) si generano nel periodo e quanto contano per i beneficiari | 1. *Outcome level in period (i)*<br>2. *Outcome threshold* (soglia di dignità/benchmark)<br>3. *Importance to stakeholder*<br>4. *SDG target* (mappatura Agenda ONU 2030) |
| **WHO** | Chi sperimenta il cambiamento e il livello di vulnerabilità pre-esistente (*baseline*) | 5. *Stakeholder segment*<br>6. *Geographical boundary*<br>7. *Outcome level at baseline (ii)* (*Underserved* vs *Well-served*)<br>8. *Stakeholder characteristics* (disaggregazione ISEE, genere, età) |
| **HOW MUCH** | Entità, profondità e orizzonte temporale del cambiamento | 9. *Scale* (ampiezza numerica dei beneficiari)<br>10. *Depth* (grado di trasformazione: delta periodo vs baseline)<br>11. *Duration* (persistenza a lungo termine) |
| **CONTRIBUTION** | Addizionalità rispetto allo scenario controfattuale (inerzia di mercato) | 12. *Depth counterfactual* (*Likely better* / *Likely worse*)<br>13. *Duration counterfactual* |
| **RISK** | Presidio e mitigazione dei 9 rischi di mancato impatto codificati dall'IMP | 14. *Risk type* (identificazione puntuale tra i 9 rischi codificati)<br>15. *Risk level* (*Low risk* / *High risk*) |

### I 9 Rischi di Impatto Codificati dall'IMP
Impact Forge permette di mappare ciascuna categoria di rischio con presidi specifici:
1. **Evidence Risk**: insufficienza o scarsa attendibilità dei dati raccolti.
2. **External Risk**: eventi esterni esogeni (macroeconomici, normativi) che compromettono l'esito.
3. **Unexpected Impact Risk**: insorgenza di esternalità negative collaterali non previste.
4. **Drop-off Risk**: decadimento progressivo del beneficio nel tempo dopo l'intervento.
5. **Efficiency Risk**: spesa di risorse sproporzionata rispetto all'impatto ottenuto.
6. **Execution Risk**: carenze operative o di governance dell'attuatore nell'erogare l'intervento.
7. **Alignment Risk**: divergenza tra gli obiettivi dei finanziatori e i reali bisogni dei beneficiari.
8. **Endurance Risk**: incapacità dell'attività di proseguire per la durata necessaria.
9. **Stakeholder Participation Risk**: mancato ingaggio attivo o abbandono da parte della comunità.

### Dati Self-Reported vs Non-Self-Reported
Per evitare il fenomeno dell'*impact washing*, la piattaforma implementa una classificazione binaria delle evidenze:
- **Dati Self-Reported**: survey dirette, risposte qualitative su scala Likert dei beneficiari (cruciali per le dimensioni *WHAT* e *WHO*).
- **Dati Non-Self-Reported**: registri presenze, flussi contributivi INPS (UNIEMENS), dati catastali, banche dati ISTAT e sensori IoT (cruciali per *HOW MUCH* e *CONTRIBUTION*).

### Classificazione delle Imprese (BICE Framework)
In base all'analisi congiunta delle 5 dimensioni, l'organizzazione e il singolo progetto vengono posizionati in una delle tre classi operative:
- **CLASSE A (Act to avoid harm)**: opera per mitigare i rischi ESG e prevenire impatti negativi.
- **CLASSE B (Benefit stakeholders)**: genera benefici diretti e positivi per stakeholder primari.
- **CLASSE C (Contribute to solutions)**: affronta sfide sociali o ambientali complesse a beneficio di popolazioni gravemente vulnerabili e sottoservite (*alta addizionalità*).
- **Regola IMP di Cautela**: in assenza di dati coperti per tutte le 5 dimensioni, l'ente non può accedere alle classi B o C a causa del rischio di impatti negativi occulti.

---

## 3. Il Salto di Qualità: Mechanism Design & Cost-Effectiveness

### Superamento dei Limiti dell'IMP Tradizionale
L'IMP convenzionale è uno strumento prevalentemente **diagnostico e descrittivo**: certifica se un impatto è positivo o negativo, ma presenta due limiti strutturali quando applicato alla finanza:
1. **Assenza di Comparazione Efficace**: non misura il costo comparato rispetto a soluzioni alternative (*quanto costa quell'impatto rispetto ad altri interventi concorrenti?*).
2. **Assenza di Dinamica Incentivante**: non crea un ritorno economico correlato all'efficienza trasformativa, lasciando i progetti dipendenti da erogazioni a pioggia.

### Il Costo per Outcome come Benchmark Competitivo
In Impact Forge, l'IMP è potenziato dall'indicatore di **Costo per Outcome**:

$$\text{Costo per Outcome} = \frac{\text{Budget Totale Speso}}{\text{Numero di Outcome Finali Certificati}}$$

*Esempio reale*: se il progetto *Scuola dei Mestieri Digitali* spende 600.000 € e inserisce stabilmente 60 giovani NEET, il costo per outcome è di **10.000 €/persona**. 
Questo indicatore consente alla Pubblica Amministrazione e ai Fondi d'Impatto di condurre gare e bandi competitivi premiando chi genera lo stesso impatto al minor costo pubblico o con la maggiore efficacia trasformativa.

### Incentivi Allineati per Beneficiari, Attuatori e Investitori

Grazie al **Mechanism Design**, la piattaforma genera un surplus netto per tutte le parti coinvolte:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       MECCANISMO INCENTIVANTE AD IMPATTO (WIN-WIN)                           │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. PER LA PUBBLICA AMMINISTRAZIONE / FILANTROPIA (Outcome Payer)                            │
│    • Paga solo a risultato convalidato (Zero rischio di sperpero pubblico).                 │
│    • Risparmio Controfattuale Netto: minor spesa in sussidi e maggiori entrate fiscali      │
│      superiori al costo dell'Outcome Payment concordato (Benefit-Cost Ratio > 1.0x).        │
│                                                                                             │
│ 2. PER GLI INVESTITORI PRIVATI & ISTITUZIONALI (Impact Investors)                           │
│    • Capitale protetto da garanzie pubbliche (MCC 80% / FEI) che abbattono la perdita attesa.│
│    • Rendimento finanziario maggiorato da un Success Premium legato al raggiungimento KPI.   │
│                                                                                             │
│ 3. PER L'ATTUATORE SOCIALE (ETS / Impresa Sociale / Cooperativa)                            │
│    • Liquidità immediata fornita dagli investitori (nessun deficit di cassa iniziale).       │
│    • Margine di performance (Success Fee) reinvestibile nella crescita dell'ente.          │
│                                                                                             │
│ 4. PER I BENEFICIARI FINALI (Cittadini & Comunità)                                          │
│    • Servizi sociali altamente efficaci e monitorati, con impatto duraturo nel tempo.       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Motore Matematico, Finanziario ed Algoritmico

Tutte le formule matematiche e finanziarie sono implementate in modo reattivo e deterministico in [`src/lib/finance.ts`](file:///c:/Users/user/Desktop/ai-arena-impact-venture-building-platform-deepseek-v4-pro-max/src/lib/finance.ts) e documentate in [`docs/CALCOLI_E_FORMULE.md`](file:///c:/Users/user/Desktop/ai-arena-impact-venture-building-platform-deepseek-v4-pro-max/docs/CALCOLI_E_FORMULE.md).

### Blended Finance & Waterfall di Capitale
La piattaforma struttura architetture finanziarie complesse che combinano 7 tipologie di strumenti:
1. **Grant Filantropico / Fondo Perduto** (Costo: $0\%$)
2. **Prestito Agevolato / Tasso Agevolato** (Costo convenzionale: $2.0\%$)
3. **Debito Senior Bancario** (Costo convenzionale: $6.5\%$)
4. **Garanzia Pubblica MCC / FEI** (Costo convenzionale: $1.2\%$)
5. **Equity Paziente / Mezzanino** (Costo convenzionale: $12.0\%$)
6. **Social Impact Bond / Outcome Payment** (Costo convenzionale: $15.0\%$)
7. **Revenue Sharing / Community Shares** (Costo convenzionale: $4.0\% - 5.0\%$)

#### Formule Finanziarie Chiave:
- **Leva Finanziaria Blended**:
  $$\text{Leva} = \frac{\text{Total Funding}}{\text{Grant Funding}}$$
- **WACC Blended (Weighted Average Cost of Capital)**:
  $$\text{WACC} = \frac{\sum_{i=1}^N (\text{amount}_i \times \text{cost}_i)}{\text{Total Funding}}$$
- **Ammortamento Francese a Rata Costante**:
  $$A = \frac{P \cdot r \cdot (1+r)^n}{(1+r)^n - 1}$$
- **DSCR (Debt Service Coverage Ratio)**:
  $$\text{DSCR} = \frac{\text{NOI (Margine Operativo Netto)}}{\text{Debt Service (Rata Totale Annua Debito)}} \ge 1.20$$

### Modelli Pay for Success (PFS) & Social Impact Bond (SIB)
A differenza dei modelli standard in cui il SIB viene erroneamente sommato alla cassa iniziale, Impact Forge modella correttamente i due contratti tipici:
1. **Social Impact Bond (SIB Quadripartito)**:
   - $t_0$: L'Outcome Payer non sborsa liquidità; gli investitori privati coprono il capitale circolante (*Bridge Investment*).
   - $t_n$: L'Auditor terzo valida gli esiti $\rightarrow$ la PA liquida l'Outcome Payment $\rightarrow$ rimborso capitale e *Success Premium* agli investitori.
2. **Direct Pay for Success (PbR Bipartito)**:
   - Contratto diretto tra Finanziatore e Attuatore con sblocchi a Stato Avanzamento Lavori (SAL) legati al superamento di soglie di outcome.

#### Stima del Valore Netto dell'Outcome:
$$\text{Valore Netto Outcome} = \text{Valore Sociale Lordo} - \text{Costo Unitario Outcome}$$
$$\text{Benefit-Cost Ratio (BCR)} = \frac{\text{Valore Sociale Lordo}}{\text{Costo Unitario Outcome}}$$

### Condizioni di Sblocco Algoritmiche a Risultato
Nel database e nello state machine ogni tranche a performance registra una condizione logica formale:
$$\texttt{"kpi:\{kpiId\} >= \{targetUnits\}"}$$
*Esempio*: `kpi:9 >= 50` (sblocco automatico subordinato alla convalida di almeno 50 contratti di lavoro certificati dall'Auditor).

### Valutazione del Credito: Basilea II/III & Expected Loss
Il modulo di underwriting integra i requisiti di vigilanza prudenziale bancaria:
- **Score di Merito Integrato**:
  $$\text{Final Score} = 0.55 \times \text{Credit Score} + 0.45 \times \text{Impact Score}$$
- **Expected Loss Bancaria**:
  $$\text{EL} = \text{PD} \times \text{LGD} \times \text{EAD}$$
  Grazie all'intervento della garanzia pubblica (es. MCC 80%), la $\text{LGD}$ scende dallo standard del $45\%$ al **$9\%$**, abbattendo drasticamente la perdita attesa per gli istituti finanziatori.

---

## 5. Architettura dei 6 Agenti AI Decisionali

Impact Forge integra 6 agenti intelligenti cooperativi specializzati lungo il ciclo di vita del venture building:

| Agente AI | Ruolo Chiave | Modelli & Calcoli Eseguiti |
| :--- | :--- | :--- |
| 🔍 **1. Scout Agent** | *Need Sensing & Origination* | Calcola l'**Opportunity Score** ponderando gravità del bisogno, potenziale economico e asset territoriali non valorizzati. |
| 🏛️ **2. Architect Agent** | *Co-Design & Coalizione* | Analizza la completezza della Teoria del Cambiamento (ToC), rileva i nodi mancanti e propone benchmark di venture affini. |
| 💼 **3. Structurer Agent** | *Blended Finance Optimizer* | Solutore vincolato che dimensiona il debito sostenibile sul margine operativo ($\text{DSCR} \ge 1.25$), applica garanzie e calcola il WACC. |
| 🛡️ **4. Underwriter Agent** | *Risk Scoring & Compliance* | Elabora l'Expected Loss bancaria (Basilea), verifica DNSH e allineamento EU Taxonomy, emette il parere di bancabilità. |
| ⚖️ **5. MRV Agent** | *Audit & Monitoraggio* | Ispeziona le evidenze primarie caricate, rileva alert di scostamento a metà timeline e calcola lo SROI dinamico. |
| 📢 **6. Storyteller Agent** | *Dossier Multi-Stakeholder* | Redige automaticamente executive summary differenziati per PA (delibera), Banche (istruttoria) e Cittadini (trasparenza). |

---

## 6. Design System Tattile 3D (Claymorphic)

L'interfaccia utente di Impact Forge adotta un linguaggio visivo tridimensionale e fisico:
- **Spessori in risalto con smusso e luce radente**: schede e contenitori estruse dal piano di lavoro beige materico (`.tactile-card`, `.tactile-card-raised`).
- **Incisioni materiche per cifre e testi (Debossed / Letterpress)**: numeri e metriche scavate nella pietra/argilla (`.text-engraved`, `.text-engraved-strong`).
- **Spazi di testo e input concavi**: tutti i campi di inserimento (`<input>`, `<textarea>`, `<select>`, `.tactile-input`) possiedono un'ombreggiatura interna superiore e un riflesso inferiore che simulano un solco scavato.
- **Scorrimento fluido privo di barre laterali**: le barre di scorrimento invasive del browser sono interamente nascoste (`scrollbar-width: none`), consentendo la navigazione solo tramite scrolling naturale con rotella e touch.

---

## 7. Stack Tecnologico & Avvio Locale

### Requisiti
- **Node.js**: $\ge 18.17.0$
- **npm** o **pnpm**

### Installazione ed Esecuzione

```bash
# 1. Clona il repository
git clone https://github.com/EmanueleDeCandia/impact-venture-building-platform.git
cd impact-venture-building-platform

# 2. Installa le dipendenze
npm install

# 3. Avvia l'ambiente di sviluppo locale
npm run dev
```

L'applicazione sarà attiva su `http://localhost:3000`.

### Script Disponibili
- `npm run dev`: avvia il server di sviluppo con hot-reloading.
- `npm run build`: compila il bundle di produzione Next.js.
- `npm run start`: avvia il server in modalità produzione.
- `npm run lint`: esegue la scansione ESLint sul codice sorgente.
- `npx tsc --noEmit`: verifica statica dei tipi TypeScript.

---

## 8. Riferimenti alla Documentazione

Per approfondimenti verticali, consultare i documenti dettagliati nella cartella `/docs`:
- 📖 [**Guida Operativa all'Utilizzo del Framework IMP**](file:///c:/Users/user/Desktop/ai-arena-impact-venture-building-platform-deepseek-v4-pro-max/docs/Guida%20Operativa%20all%27Utilizzo%20del%20Framework%20IMP.md): spiegazione didattica ed operativa delle 5 dimensioni, matrice di compilazione e classificazione BICE.
- 📐 [**Documentazione Tecnica: Calcoli, Formule & Modelli PFS**](file:///c:/Users/user/Desktop/ai-arena-impact-venture-building-platform-deepseek-v4-pro-max/docs/CALCOLI_E_FORMULE.md): derivazioni matematiche complete, formule di Blended Finance, modelli SIB/PFS e specifiche degli Agenti AI.
- 📋 [**IMP Impact of an Enterprise Framework**](file:///c:/Users/user/Desktop/ai-arena-impact-venture-building-platform-deepseek-v4-pro-max/docs/IMP_Impact_of_an_Enterprise_Framework.md): schema standard internazionale delle 15 categorie dati IMP.

---

*Impact Forge — Trasformare l'intenzione d'impatto in valore economico misurabile, contrattualizzato e scalabile.*
