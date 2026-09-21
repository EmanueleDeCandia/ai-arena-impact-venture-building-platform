"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  FileCheck2,
  FileSpreadsheet,
  FolderOpen,
  Info,
  Layers,
  Pencil,
  Plus,
  Printer,
  RefreshCcw,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  ATTUATOR_TYPE_LABELS,
  AssessmentEntity,
  AttuatorProfile,
  AttuatorType,
  CLASSIFICATION_INFO,
  IMP_CATEGORIES,
  IMP_RISK_TYPES,
  INITIAL_DEFAULT_ASSESSMENTS,
  INITIAL_DEFAULT_IMPACTS,
  INITIAL_DEFAULT_PROFILE,
  ImpactCategoryDef,
  ImpactClassification,
  ImpactDimensionKey,
  ImpactItem,
  ImpactRowData,
  TARGET_SUPPORTER_LABELS,
  TargetSupporterType,
  cloneAssessment,
  createDefaultRowForCategory,
} from "@/lib/imp-framework";
import { Badge, Card, Modal, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/format";

const STORAGE_KEY = "arena_impact_assessments_v2";

const DIMENSION_COLORS: Record<ImpactDimensionKey, { bg: string; text: string; border: string; badge: string }> = {
  WHAT: { bg: "bg-emerald-50/70", text: "text-emerald-900", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  WHO: { bg: "bg-blue-50/70", text: "text-blue-900", border: "border-blue-200", badge: "bg-blue-100 text-blue-800 border-blue-300" },
  HOW_MUCH: { bg: "bg-purple-50/70", text: "text-purple-900", border: "border-purple-200", badge: "bg-purple-100 text-purple-800 border-purple-300" },
  CONTRIBUTION: { bg: "bg-amber-50/70", text: "text-amber-900", border: "border-amber-200", badge: "bg-amber-100 text-amber-800 border-amber-300" },
  RISK: { bg: "bg-rose-50/70", text: "text-rose-900", border: "border-rose-200", badge: "bg-rose-100 text-rose-800 border-rose-300" },
};

export function ImpactAssessmentPanel() {
  const [assessments, setAssessments] = useState<AssessmentEntity[]>(INITIAL_DEFAULT_ASSESSMENTS);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string>(INITIAL_DEFAULT_ASSESSMENTS[0].id);
  const [activeImpactIndex, setActiveImpactIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"ASSESSMENT" | "GUIDA" | "REPORT_SOSTENITORI">("ASSESSMENT");
  const [showCloneModal, setShowCloneModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states for Cloning / Adding New Assessment
  const [cloneFormTitle, setCloneFormTitle] = useState<string>("");
  const [cloneFormAttuatorName, setCloneFormAttuatorName] = useState<string>("");
  const [cloneFormType, setCloneFormType] = useState<AttuatorType>("IMPRESA_SOCIALE");
  const [cloneFormTargetSupporter, setCloneFormTargetSupporter] = useState<TargetSupporterType>("PA_PUBBLICA_AMMINISTRAZIONE");
  const [cloneFormSector, setCloneFormSector] = useState<string>("");
  const [cloneFormTerritory, setCloneFormTerritory] = useState<string>("");
  const [cloneMode, setCloneMode] = useState<"COPY_CURRENT" | "BLANK_TEMPLATE">("COPY_CURRENT");

  const [collapsedDimensions, setCollapsedDimensions] = useState<Record<ImpactDimensionKey, boolean>>({
    WHAT: false,
    WHO: false,
    HOW_MUCH: false,
    CONTRIBUTION: false,
    RISK: false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAssessments(parsed);
          setActiveAssessmentId(parsed[0].id);
        }
      }
    } catch (e) {
      console.warn("Could not load assessments from localStorage:", e);
    }
  }, []);

  // Sync to localStorage
  const saveToStorage = (updatedAssessments: AssessmentEntity[]) => {
    setAssessments(updatedAssessments);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAssessments));
    } catch (e) {
      console.warn("Could not save assessments to localStorage:", e);
    }
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const currentAssessment =
    assessments.find((a) => a.id === activeAssessmentId) || assessments[0] || INITIAL_DEFAULT_ASSESSMENTS[0];
  const profile = currentAssessment.profile;
  const impacts = currentAssessment.impacts;
  const currentImpact = impacts[activeImpactIndex] ?? impacts[0];

  // Open clone modal with pre-filled default data
  const handleOpenCloneModal = () => {
    const nextCount = assessments.length + 1;
    setCloneFormTitle(`Assessment ${nextCount} · Valutazione Nuova Proposta d'Impatto`);
    setCloneFormAttuatorName(`${profile.name} (Nuova Iniziativa)`);
    setCloneFormType(profile.type);
    setCloneFormTargetSupporter(profile.targetSupporter);
    setCloneFormSector(profile.sector);
    setCloneFormTerritory(profile.territory);
    setCloneMode("COPY_CURRENT");
    setShowCloneModal(true);
  };

  // Submit Clone / Add Assessment
  const handleConfirmClone = () => {
    if (!cloneFormTitle.trim()) {
      alert("Inserire un titolo per distinguere l'assessment.");
      return;
    }

    let newEntity: AssessmentEntity;
    if (cloneMode === "COPY_CURRENT") {
      newEntity = cloneAssessment(
        currentAssessment,
        cloneFormTitle,
        cloneFormAttuatorName,
        cloneFormType,
        cloneFormTargetSupporter
      );
      newEntity.profile.sector = cloneFormSector || currentAssessment.profile.sector;
      newEntity.profile.territory = cloneFormTerritory || currentAssessment.profile.territory;
    } else {
      const newId = `ass-${Date.now()}`;
      const nextNum = Math.floor(100 + Math.random() * 900);
      newEntity = {
        id: newId,
        code: `ASS-${nextNum}`,
        assessmentTitle: cloneFormTitle.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profile: {
          name: cloneFormAttuatorName.trim() || "Nuovo Soggetto Attuatore",
          type: cloneFormType,
          targetSupporter: cloneFormTargetSupporter,
          sector: cloneFormSector.trim() || "Innovazione Sociale",
          territory: cloneFormTerritory.trim() || "Nazionale / Territoriale",
          mission: "Sintesi della proposta e degli obiettivi di impatto.",
          overallClassification: "BENEFIT_STAKEHOLDERS",
        },
        impacts: INITIAL_DEFAULT_IMPACTS.map((imp, idx) => ({
          id: `imp-${newId}-${idx + 1}`,
          title: `Impatto ${idx + 1}: Obiettivo Specifico`,
          description: "Descrizione dell'esito per i beneficiari.",
          classification: "BENEFIT_STAKEHOLDERS",
          rows: IMP_CATEGORIES.map((c, cIdx) => ({
            rowId: `row-${newId}-${c.id}-${cIdx}`,
            categoryId: c.id,
            indicator: "",
            data: "",
            source: "",
            sourceType: "SELF_REPORTED",
            assessment: c.assessmentOptions ? c.assessmentOptions[0].value : "",
            target: "",
          })),
        })),
        notes: "Nuovo assessment inizializzato da template IMP.",
      };
    }

    const nextList = [...assessments, newEntity];
    saveToStorage(nextList);
    setActiveAssessmentId(newEntity.id);
    setActiveImpactIndex(0);
    setShowCloneModal(false);
    triggerNotification(`Assessment "${newEntity.assessmentTitle}" creato e registrato!`);
  };

  // Delete current assessment
  const handleDeleteAssessment = (id: string) => {
    if (assessments.length <= 1) {
      triggerNotification("È necessario mantenere almeno un assessment attivo nel sistema.");
      return;
    }
    const target = assessments.find((a) => a.id === id);
    const nextList = assessments.filter((a) => a.id !== id);
    saveToStorage(nextList);
    setActiveAssessmentId(nextList[0].id);
    setActiveImpactIndex(0);
    triggerNotification(`Assessment "${target?.assessmentTitle || "selezionato"}" eliminato dal sistema.`);
  };

  // Update current assessment's impacts
  const updateCurrentImpacts = (newImpacts: ImpactItem[]) => {
    const updatedList = assessments.map((ass) => {
      if (ass.id === activeAssessmentId) {
        return { ...ass, impacts: newImpacts, updatedAt: new Date().toISOString() };
      }
      return ass;
    });
    saveToStorage(updatedList);
  };

  // Update current assessment's profile
  const updateCurrentProfile = (newProfile: AttuatorProfile, notes?: string) => {
    const updatedList = assessments.map((ass) => {
      if (ass.id === activeAssessmentId) {
        return {
          ...ass,
          profile: newProfile,
          notes: notes !== undefined ? notes : ass.notes,
          updatedAt: new Date().toISOString(),
        };
      }
      return ass;
    });
    saveToStorage(updatedList);
  };

  // Add impact to current assessment
  const handleAddImpact = () => {
    const nextNumber = impacts.length + 1;
    const newImpact: ImpactItem = {
      id: `imp-${activeAssessmentId}-${Date.now()}`,
      title: `Impatto ${nextNumber}: Nuovo Obiettivo di Impatto Sociale / Ambientale`,
      description: "Descrivere l'esito generato per i beneficiari, il problema sociale affrontato e la modalità di intervento.",
      classification: "BENEFIT_STAKEHOLDERS",
      rows: IMP_CATEGORIES.map((cat, idx) => ({
        rowId: `row-${Date.now()}-${cat.id}-${idx}`,
        categoryId: cat.id,
        indicator: "",
        data: "",
        source: "",
        sourceType: "SELF_REPORTED",
        assessment: cat.assessmentOptions ? cat.assessmentOptions[0].value : "",
        target: "",
      })),
    };
    const nextImpacts = [...impacts, newImpact];
    updateCurrentImpacts(nextImpacts);
    setActiveImpactIndex(impacts.length);
    triggerNotification(`Impatto ${nextNumber} aggiunto con successo!`);
  };

  // Remove impact from current assessment - immediate reliable execution
  const handleRemoveImpact = (index: number) => {
    if (impacts.length <= 1) {
      triggerNotification("È necessario mantenere almeno un impatto per la qualificazione.");
      return;
    }
    const targetTitle = impacts[index]?.title || `Impatto ${index + 1}`;
    const nextImpacts = impacts.filter((_, i) => i !== index);
    updateCurrentImpacts(nextImpacts);
    setActiveImpactIndex((prev) => Math.max(0, Math.min(prev, nextImpacts.length - 1)));
    triggerNotification(`"${targetTitle}" eliminato.`);
  };

  // MULTI-ROW ADDITION: Add extra row to a specific category
  const handleAddRowToCategory = (cat: ImpactCategoryDef, customRiskType?: string) => {
    const newRow = createDefaultRowForCategory(cat, customRiskType);
    const nextImpacts = [...impacts];
    const imp = { ...nextImpacts[activeImpactIndex] };
    imp.rows = [...imp.rows, newRow];
    nextImpacts[activeImpactIndex] = imp;
    updateCurrentImpacts(nextImpacts);
    triggerNotification(`Nuova riga aggiunta per "${cat.name.split("(")[0]}"`);
  };

  // MULTI-ROW REMOVAL: Remove a specific row by its rowId
  const handleRemoveRowByRowId = (rowId: string, categoryId: number) => {
    const categoryRows = currentImpact.rows.filter((r) => r.categoryId === categoryId);
    if (categoryRows.length <= 1) {
      triggerNotification("È necessario mantenere almeno una riga di dati per questa categoria.");
      return;
    }
    const nextImpacts = [...impacts];
    const imp = { ...nextImpacts[activeImpactIndex] };
    imp.rows = imp.rows.filter((r) => r.rowId !== rowId);
    nextImpacts[activeImpactIndex] = imp;
    updateCurrentImpacts(nextImpacts);
    triggerNotification("Riga rimossa con successo.");
  };

  // MULTI-ROW UPDATE: Update a specific row by its rowId
  const handleUpdateRowByRowId = (
    rowId: string,
    field: "indicator" | "data" | "source" | "sourceType" | "assessment" | "target",
    value: string
  ) => {
    const nextImpacts = [...impacts];
    const imp = { ...nextImpacts[activeImpactIndex] };
    imp.rows = imp.rows.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r));
    nextImpacts[activeImpactIndex] = imp;
    updateCurrentImpacts(nextImpacts);
  };

  // Update impact metadata (title, description, classification)
  const handleUpdateImpactMeta = (field: "title" | "description" | "classification", value: string) => {
    const nextImpacts = [...impacts];
    nextImpacts[activeImpactIndex] = { ...nextImpacts[activeImpactIndex], [field]: value };
    updateCurrentImpacts(nextImpacts);
  };

  // Reset to initial default assessments
  const handleResetAllDefaults = () => {
    saveToStorage(INITIAL_DEFAULT_ASSESSMENTS);
    setActiveAssessmentId(INITIAL_DEFAULT_ASSESSMENTS[0].id);
    setActiveImpactIndex(0);
    triggerNotification("Assessment di default ripristinati con successo.");
  };

  // Calcolo dinamico della copertura formale delle 5 dimensioni IMP per l'impatto corrente
  const isRowFilled = (r: ImpactRowData) => {
    const hasData = Boolean(r.data && r.data.trim() !== "" && r.data.trim() !== "—");
    const hasIndicator = Boolean(r.indicator && r.indicator.trim() !== "");
    const hasAssessment = Boolean(r.assessment && r.assessment.trim() !== "");
    return hasData || (hasIndicator && hasAssessment);
  };

  const currentRows = currentImpact?.rows || [];
  const dimensionCoverage = {
    WHAT: currentRows.filter((r) => r.categoryId >= 1 && r.categoryId <= 4).some(isRowFilled),
    WHO: currentRows.filter((r) => r.categoryId >= 5 && r.categoryId <= 8).some(isRowFilled),
    HOW_MUCH: currentRows.filter((r) => r.categoryId >= 9 && r.categoryId <= 11).some(isRowFilled),
    CONTRIBUTION: currentRows.filter((r) => r.categoryId >= 12 && r.categoryId <= 13).some(isRowFilled),
    RISK: currentRows.filter((r) => r.categoryId >= 14 && r.categoryId <= 15).some(isRowFilled),
  };

  const coveredDimensionsCount = Object.values(dimensionCoverage).filter(Boolean).length;

  const getSupporterEligibility = (count: number) => {
    switch (count) {
      case 5:
        return {
          count: 5,
          label: "Completo (5/5 Dimensioni coperte)",
          verdict: "IDONEO / BANCABILE",
          verdictSub: "5/5 Dimensioni conformi allo standard IMP",
          color: "text-emerald-400",
          border: "border-emerald-300",
          bg: "bg-emerald-50",
          badgeCls: "bg-emerald-100 text-emerald-800 border-emerald-300",
          statusColor: "text-emerald-700",
        };
      case 4:
        return {
          count: 4,
          label: "Da Completare (4/5 Dimensioni coperte)",
          verdict: "PRE-IDONEO / DA COMPLETARE",
          verdictSub: "4/5 Dimensioni coperte (manca 1 dimensione)",
          color: "text-amber-400",
          border: "border-amber-300",
          bg: "bg-amber-50",
          badgeCls: "bg-amber-100 text-amber-800 border-amber-300",
          statusColor: "text-amber-700",
        };
      case 3:
        return {
          count: 3,
          label: "Incompleto (3/5 Dimensioni coperte)",
          verdict: "INCOMPLETO",
          verdictSub: "3/5 Dimensioni coperte (integrazione richiesta)",
          color: "text-amber-400",
          border: "border-amber-300",
          bg: "bg-amber-50",
          badgeCls: "bg-amber-100 text-amber-800 border-amber-300",
          statusColor: "text-amber-700",
        };
      case 2:
        return {
          count: 2,
          label: "Non Idoneo (2/5 Dimensioni coperte)",
          verdict: "NON IDONEO",
          verdictSub: "2/5 Dimensioni coperte (dati insufficienti)",
          color: "text-orange-400",
          border: "border-orange-300",
          bg: "bg-orange-50",
          badgeCls: "bg-orange-100 text-orange-800 border-orange-300",
          statusColor: "text-orange-700",
        };
      case 1:
        return {
          count: 1,
          label: "Non valutabile (1/5 Dimensioni coperte)",
          verdict: "NON VALUTABILE",
          verdictSub: "1/5 Dimensioni coperte (mancano evidenze minime)",
          color: "text-rose-400",
          border: "border-rose-300",
          bg: "bg-rose-50",
          badgeCls: "bg-rose-100 text-rose-800 border-rose-300",
          statusColor: "text-rose-700",
        };
      case 0:
      default:
        return {
          count: 0,
          label: "Inidoneo (0/5 Dimensioni coperte)",
          verdict: "INIDONEO",
          verdictSub: "0/5 Dimensioni coperte (modulo non compilato)",
          color: "text-rose-400",
          border: "border-rose-300",
          bg: "bg-rose-50",
          badgeCls: "bg-rose-100 text-rose-800 border-rose-300",
          statusColor: "text-rose-700",
        };
    }
  };

  const supporterEligibility = getSupporterEligibility(coveredDimensionsCount);

  const handleSelectTab = (tab: "ASSESSMENT" | "GUIDA" | "REPORT_SOSTENITORI") => {
    setActiveTab(tab);
    if (tab === "REPORT_SOSTENITORI") {
      triggerNotification(`Report Sostenitori: ${supporterEligibility.label}`);
    }
  };

  const toggleDimensionCollapse = (dim: ImpactDimensionKey) => {
    setCollapsedDimensions((prev) => ({ ...prev, [dim]: !prev[dim] }));
  };

  // Group categories into the 5 dimensions
  const dimensions: { key: ImpactDimensionKey; label: string; sub: string; categories: ImpactCategoryDef[] }[] = [
    {
      key: "WHAT",
      label: "1. DIMENSIONE WHAT (Cosa si genera)",
      sub: "Quali esiti (outcomes) si generano nel periodo e quanto contano per i beneficiari",
      categories: IMP_CATEGORIES.filter((c) => c.dimension === "WHAT"),
    },
    {
      key: "WHO",
      label: "2. DIMENSIONE WHO (Chi vive l'esito)",
      sub: "Profilo dei beneficiari, livello di vulnerabilità pre-esistente (baseline) e territorio",
      categories: IMP_CATEGORIES.filter((c) => c.dimension === "WHO"),
    },
    {
      key: "HOW_MUCH",
      label: "3. DIMENSIONE HOW MUCH (Quanto impatto)",
      sub: "Scala numerica, profondità del cambiamento (delta baseline-periodo) e durata nel tempo",
      categories: IMP_CATEGORIES.filter((c) => c.dimension === "HOW_MUCH"),
    },
    {
      key: "CONTRIBUTION",
      label: "4. DIMENSIONE CONTRIBUTION (Addizionalità & Contributo)",
      sub: "Valutazione dello scenario controfattuale: quanto sarebbe accaduto comunque senza l'intervento",
      categories: IMP_CATEGORIES.filter((c) => c.dimension === "CONTRIBUTION"),
    },
    {
      key: "RISK",
      label: "5. DIMENSIONE RISK (Rischio di Impatto)",
      sub: "Identificazione dei 9 rischi IMP e valutazione combinata di probabilità e severità",
      categories: IMP_CATEGORIES.filter((c) => c.dimension === "RISK"),
    },
  ];

  // Metrics for active assessment
  const filledRowsCount = currentImpact?.rows.filter((r) => r.indicator.trim() !== "" && r.data.trim() !== "").length ?? 0;
  const totalRowsCount = currentImpact?.rows.length || IMP_CATEGORIES.length;
  const completionPercentage = Math.round((filledRowsCount / Math.max(1, totalRowsCount)) * 100);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-emerald-500/50">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* TOP MULTI-ASSESSMENT SWITCHER & CLONE TOOLBAR */}
      <Card className="p-4 bg-slate-900 border-slate-800 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          {/* Assessment Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                <FolderOpen className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Assessment Attivo:
              </span>
            </div>

            <select
              value={activeAssessmentId}
              onChange={(e) => {
                setActiveAssessmentId(e.target.value);
                setActiveImpactIndex(0);
              }}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-inner focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 max-w-md truncate"
            >
              {assessments.map((ass) => (
                <option key={ass.id} value={ass.id}>
                  [{ass.code}] {ass.assessmentTitle} — {ass.profile.name}
                </option>
              ))}
            </select>

            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-400">
              {currentAssessment.code}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                saveToStorage(assessments);
                triggerNotification("✓ Dati salvati in locale nel Browser!");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-950/50 px-3.5 py-2 text-xs font-bold text-emerald-300 shadow-sm transition hover:bg-emerald-900/60 hover:text-white"
              title="Salva immediatamente lo stato in localStorage"
            >
              <Save className="h-3.5 w-3.5 text-emerald-400" />
              Salva nel Browser
            </button>

            <button
              type="button"
              onClick={handleOpenCloneModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-900/30 transition hover:from-emerald-400 hover:to-teal-400"
            >
              <Copy className="h-3.5 w-3.5" />
              Aggiungi / Clona Assessment
            </button>

            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifica Dati
            </button>

            {assessments.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteAssessment(activeAssessmentId)}
                title="Elimina questo assessment"
                className="inline-flex items-center gap-1 rounded-xl border border-rose-900/40 bg-rose-950/40 p-2 text-xs text-rose-400 hover:bg-rose-900/60 hover:text-rose-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleResetAllDefaults}
              title="Ripristina assessment predefiniti"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/50 p-2 text-xs text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Card>

      {/* Hero Card for Current Assessment Profile */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                {currentAssessment.code} · Pre-Qualificazione Attuatore
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 text-xs text-slate-300">
                {ATTUATOR_TYPE_LABELS[profile.type]}
              </span>
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs text-sky-300">
                Target: {TARGET_SUPPORTER_LABELS[profile.targetSupporter].split(" ")[0]}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {currentAssessment.assessmentTitle}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white lg:text-3xl">
                {profile.name}
              </h1>
            </div>

            <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
              {profile.mission}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span>📍 Territorio: <strong className="text-slate-200">{profile.territory}</strong></span>
              <span>🏷️ Settore: <strong className="text-slate-200">{profile.sector}</strong></span>
              <span>🎯 Sostenitore: <strong className="text-slate-200">{TARGET_SUPPORTER_LABELS[profile.targetSupporter]}</strong></span>
              <span>🕒 Ultimo aggiornamento: <strong className="text-slate-200">{new Date(currentAssessment.updatedAt).toLocaleDateString("it-IT")}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setActiveTab("REPORT_SOSTENITORI");
                setTimeout(() => window.print(), 300);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-900/30 transition hover:from-emerald-400 hover:to-teal-400"
            >
              <Printer className="h-4 w-4" />
              Stampa / Esporta Dossier
            </button>
          </div>
        </div>

        {/* Live Metrics Bar */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="text-[11px] font-medium text-slate-400">Classificazione Complessiva IMP</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={cn("rounded-md border px-2 py-0.5 text-xs font-bold", CLASSIFICATION_INFO[profile.overallClassification].badgeCls)}>
                Classe {CLASSIFICATION_INFO[profile.overallClassification].code}
              </span>
              <span className="truncate text-xs font-semibold text-white">
                {CLASSIFICATION_INFO[profile.overallClassification].label}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="text-[11px] font-medium text-slate-400">Impatti Mappati &amp; Valutati</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg font-bold text-emerald-400">{impacts.length}</span>
              <span className="text-xs text-slate-400">obiettivi specifici</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="text-[11px] font-medium text-slate-400">Righe Dati &amp; Metriche Totali</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg font-bold text-sky-400">{currentImpact?.rows.length || 0}</span>
              <span className="text-xs text-slate-400">indicatori attivi</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="text-[11px] font-medium text-slate-400">Idoneità per Sostenitori</div>
            <div className={cn("mt-1 flex items-center gap-1.5 text-xs font-bold", supporterEligibility.color)}>
              {coveredDimensionsCount === 5 ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : coveredDimensionsCount >= 3 ? (
                <Info className="h-4 w-4 shrink-0 text-amber-400" />
              ) : (
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              {supporterEligibility.label}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectTab("ASSESSMENT")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
              activeTab === "ASSESSMENT"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <FileSpreadsheet className="h-4 w-4" />
            1. Matrice di Assessment Operativo IMP
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab("GUIDA")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
              activeTab === "GUIDA"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <BookOpen className="h-4 w-4" />
            2. Guida Didattica &amp; Operativa IMP
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab("REPORT_SOSTENITORI")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
              activeTab === "REPORT_SOSTENITORI"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <FileCheck2 className="h-4 w-4" />
            3. Report Esecutivo per i Sostenitori (PA &amp; Finanziatori)
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Totale Assessment registrati: <strong>{assessments.length}</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MATRICE DI ASSESSMENT OPERATIVO IMP                               */}
      {/* ========================================================================= */}
      {activeTab === "ASSESSMENT" && (
        <div className="space-y-6">
          {/* Dynamic Impact Selector Bar */}
          <Card className="p-4 bg-slate-50 border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Impatti Rilevati in questo Assessment:
                </span>
                {impacts.map((imp, idx) => {
                  const isActive = idx === activeImpactIndex;
                  return (
                    <div
                      key={imp.id}
                      className={cn(
                        "group inline-flex items-center gap-1.5 rounded-lg pl-3 pr-2 py-1.5 text-xs font-bold transition shadow-xs",
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveImpactIndex(idx)}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Target className="h-3.5 w-3.5" />
                        <span>Impatto {idx + 1}</span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.2 text-[10px]",
                            isActive ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {CLASSIFICATION_INFO[imp.classification].code}
                        </span>
                      </button>
                      {impacts.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImpact(idx);
                          }}
                          title={`Elimina Impatto ${idx + 1}`}
                          className={cn(
                            "rounded p-0.5 transition cursor-pointer ml-1",
                            isActive
                              ? "text-emerald-100 hover:bg-emerald-700 hover:text-white"
                              : "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          )}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAddImpact}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-emerald-600 bg-emerald-50/80 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Aggiungi Nuovo Impatto
                </button>
              </div>

              {impacts.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveImpact(activeImpactIndex)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-xs hover:bg-rose-100 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Elimina Impatto {activeImpactIndex + 1}
                </button>
              )}
            </div>
          </Card>

          {/* Active Impact Header & Meta Configuration */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">
                      SCHEDA OPERATIVA {activeImpactIndex + 1} DI {impacts.length}
                    </span>
                    <span className="text-xs text-slate-500">
                      Compilazione flessibile multi-riga per ciascuna delle 15 categorie IMP (+ Target)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={currentImpact.title}
                    onChange={(e) => handleUpdateImpactMeta("title", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-lg font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Titolo dell'impatto..."
                  />
                  <textarea
                    rows={2}
                    value={currentImpact.description}
                    onChange={(e) => handleUpdateImpactMeta("description", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Descrizione sintetica dell'esito atteso per i beneficiari..."
                  />
                </div>

                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 lg:w-80">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Classificazione IMP per questo Impatto
                  </label>
                  <select
                    value={currentImpact.classification}
                    onChange={(e) => handleUpdateImpactMeta("classification", e.target.value as ImpactClassification)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="ACT_TO_AVOID_HARM">A · Agire per evitare danni (Act to avoid harm)</option>
                    <option value="BENEFIT_STAKEHOLDERS">B · Generare benefici per stakeholder (Benefit stakeholders)</option>
                    <option value="CONTRIBUTE_TO_SOLUTIONS">C · Contribuire a soluzioni (Contribute to solutions)</option>
                  </select>
                  <p className="mt-2 text-[11px] leading-snug text-slate-500">
                    {CLASSIFICATION_INFO[currentImpact.classification].description}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 5 Dimensions Accordions / Grouped Tables */}
          <div className="space-y-4">
            {dimensions.map((dim) => {
              const isCollapsed = collapsedDimensions[dim.key];
              const styling = DIMENSION_COLORS[dim.key];

              return (
                <div key={dim.key} className={cn("overflow-hidden rounded-2xl border bg-white shadow-sm transition-all", styling.border)}>
                  {/* Dimension Header Bar */}
                  <div
                    onClick={() => toggleDimensionCollapse(dim.key)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between px-6 py-4 transition select-none",
                      styling.bg
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("rounded-lg border px-2.5 py-1 text-xs font-black", styling.badge)}>
                        {dim.key}
                      </span>
                      <div>
                        <h3 className={cn("text-base font-bold", styling.text)}>{dim.label}</h3>
                        <p className="text-xs text-slate-600">{dim.sub}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500">
                        {dim.categories.length} categorie dati
                      </span>
                      <button className="rounded-lg p-1 text-slate-500 hover:bg-white/60">
                        {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Dimension Table Content */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600">
                            <th className="w-1/4 px-4 py-3 font-bold uppercase tracking-wider">
                              Categoria Dati (IMP) &amp; Azioni
                            </th>
                            <th className="w-1/5 px-4 py-3 font-bold uppercase tracking-wider">
                              1. Indicatore / Tipologia
                            </th>
                            <th className="w-1/5 px-4 py-3 font-bold uppercase tracking-wider">
                              2. Dati Rilevati (Data)
                            </th>
                            <th className="w-1/6 px-4 py-3 font-bold uppercase tracking-wider">
                              3. Fonte (Source &amp; Tipo)
                            </th>
                            <th className="w-1/6 px-4 py-3 font-bold uppercase tracking-wider">
                              4. Valutazione (Assessment)
                            </th>
                            <th className="w-28 px-4 py-3 font-bold uppercase tracking-wider">
                              Target / Presidio
                            </th>
                            <th className="w-8 px-2 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {dim.categories.map((cat) => {
                            // Find all rows for this category
                            const categoryRows = currentImpact.rows.filter((r) => r.categoryId === cat.id);
                            const activeRows: ImpactRowData[] =
                              categoryRows.length > 0
                                ? categoryRows
                                : [
                                    {
                                      rowId: `row-${cat.id}-fallback`,
                                      categoryId: cat.id,
                                      indicator: cat.defaultIndicator,
                                      data: cat.defaultData,
                                      source: cat.defaultSource,
                                      sourceType: "SELF_REPORTED",
                                      assessment: cat.defaultAssessment,
                                      target: cat.defaultTarget,
                                    },
                                  ];

                            return activeRows.map((row, rowIdx) => (
                              <tr
                                key={row.rowId}
                                className={cn(
                                  "hover:bg-slate-50/90 transition",
                                  rowIdx > 0 ? "bg-slate-50/40" : "bg-white"
                                )}
                              >
                                {/* Category Header (shown on first row or with badge on sub-rows) */}
                                <td className="p-4 align-top">
                                  {rowIdx === 0 ? (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-900">{cat.id}. {cat.name}</span>
                                        {cat.ref && (
                                          <span className="rounded bg-slate-200 px-1 py-0.2 text-[10px] font-bold text-slate-700">
                                            ({cat.ref})
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] italic text-slate-500 font-medium">
                                        IMP: {cat.originalName}
                                      </div>
                                      <p className="text-[11px] leading-relaxed text-slate-600">
                                        {cat.definition}
                                      </p>
                                      <div className="rounded bg-slate-100 p-1.5 text-[10px] text-slate-600">
                                        💡 <strong>Guida:</strong> {cat.operationalGuidance}
                                      </div>

                                      {/* Add Row Button */}
                                      <div className="pt-2">
                                        {cat.id === 14 ? (
                                          <div className="space-y-1">
                                            <button
                                              onClick={() => handleAddRowToCategory(cat)}
                                              className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-100"
                                            >
                                              <Plus className="h-3 w-3" />
                                              Aggiungi Rischio IMP ({activeRows.length} attivi)
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => handleAddRowToCategory(cat)}
                                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                                          >
                                            <Plus className="h-3 w-3" />
                                            Aggiungi Indicatore / Riga ({activeRows.length})
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1 pl-2 border-l-2 border-slate-300">
                                      <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                        ↳ Riga {rowIdx + 1} aggiuntiva ({cat.name.split("(")[0]})
                                      </span>
                                      {cat.id === 14 && (
                                        <span className="block text-[10px] text-rose-700 font-medium">
                                          Specifica ulteriore tipologia tra i 9 rischi IMP
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* 1. Indicator / Risk Selector */}
                                <td className="p-4 align-top space-y-2">
                                  {cat.id === 14 && (
                                    <div>
                                      <span className="block text-[10px] font-bold text-rose-900 mb-1">
                                        Seleziona tra i 9 Rischi IMP:
                                      </span>
                                      <select
                                        value={
                                          IMP_RISK_TYPES.some((rt) => row.indicator.includes(rt.value))
                                            ? IMP_RISK_TYPES.find((rt) => row.indicator.includes(rt.value))?.value
                                            : ""
                                        }
                                        onChange={(e) => {
                                          const selectedType = IMP_RISK_TYPES.find((rt) => rt.value === e.target.value);
                                          if (selectedType) {
                                            handleUpdateRowByRowId(row.rowId, "indicator", `${selectedType.label}`);
                                            handleUpdateRowByRowId(row.rowId, "data", `Presidio: ${selectedType.desc}`);
                                          }
                                        }}
                                        className="w-full rounded-lg border border-rose-300 bg-rose-50/60 p-1.5 text-[11px] font-bold text-rose-950 focus:border-rose-500 focus:ring-1 focus:ring-rose-200"
                                      >
                                        <option value="">-- Seleziona Rischio Codificato --</option>
                                        {IMP_RISK_TYPES.map((rt) => (
                                          <option key={rt.value} value={rt.value}>
                                            {rt.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  <textarea
                                    rows={2}
                                    value={row.indicator}
                                    onChange={(e) => handleUpdateRowByRowId(row.rowId, "indicator", e.target.value)}
                                    placeholder={cat.id === 14 ? "Dettaglio del rischio..." : "Es. % miglioramento reddito..."}
                                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                                  />
                                </td>

                                {/* 2. Data */}
                                <td className="p-4 align-top">
                                  <textarea
                                    rows={3}
                                    value={row.data}
                                    onChange={(e) => handleUpdateRowByRowId(row.rowId, "data", e.target.value)}
                                    placeholder="Es. +35% occupati a 6 mesi..."
                                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                                  />
                                </td>

                                {/* 3. Source & Source Type */}
                                <td className="p-4 align-top space-y-2">
                                  <input
                                    type="text"
                                    value={row.source}
                                    onChange={(e) => handleUpdateRowByRowId(row.rowId, "source", e.target.value)}
                                    placeholder="Es. Survey beneficiari Q2 / DB"
                                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                                  />
                                  <select
                                    value={row.sourceType}
                                    onChange={(e) => handleUpdateRowByRowId(row.rowId, "sourceType", e.target.value as any)}
                                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-700"
                                  >
                                    <option value="SELF_REPORTED">Self-Reported (Survey diretta)</option>
                                    <option value="NON_SELF_REPORTED">Non-Self-Reported (Dato oggettivo/DB)</option>
                                    <option value="MIXED">Fonte Mista (Survey + DB)</option>
                                  </select>
                                </td>

                                {/* 4. Assessment */}
                                <td className="p-4 align-top space-y-2">
                                  {cat.assessmentOptions ? (
                                    <select
                                      value={row.assessment}
                                      onChange={(e) => handleUpdateRowByRowId(row.rowId, "assessment", e.target.value)}
                                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-800 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                                    >
                                      {cat.assessmentOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <textarea
                                      rows={3}
                                      value={row.assessment}
                                      onChange={(e) => handleUpdateRowByRowId(row.rowId, "assessment", e.target.value)}
                                      placeholder="Valutazione qualitativa..."
                                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                                    />
                                  )}
                                </td>

                                {/* Target / Presidio */}
                                <td className="p-4 align-top">
                                  <input
                                    type="text"
                                    value={row.target ?? ""}
                                    onChange={(e) => handleUpdateRowByRowId(row.rowId, "target", e.target.value)}
                                    placeholder="Es. > 80% / Mitigazione..."
                                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                                  />
                                </td>

                                {/* Delete Sub-row button (if > 1 rows for this category) */}
                                <td className="p-4 align-top text-right">
                                  {activeRows.length > 1 && (
                                    <button
                                      onClick={() => handleRemoveRowByRowId(row.rowId, cat.id)}
                                      title="Elimina questa riga aggiuntiva"
                                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ));
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Tutte le righe e i rischi aggiunti vengono salvati e tracciati nello score per il Sostenitore.</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => triggerNotification("Assessment salvato con successo!")}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Save className="h-3.5 w-3.5" />
                Salva Assessment
              </button>
              <button
                onClick={() => setActiveTab("REPORT_SOSTENITORI")}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
              >
                Genera Supporter Scorecard →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GUIDA DIDATTICA ED OPERATIVA ALL'UTILIZZO DEL FRAMEWORK IMP       */}
      {/* ========================================================================= */}
      {activeTab === "GUIDA" && (
        <div className="space-y-6">
          {/* Hero Guide Card */}
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                  Guida Operativa Ufficiale IMP · Impact Management Project
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Come Compilare, Dimostrare e Rendicontare l&apos;Impatto Generato
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
                  Questa guida ti accompagna passo dopo passo nell&apos;applicazione del framework metodologico internazionale <strong>IMP</strong>.
                  L&apos;obiettivo è permettere ad ogni attuatore (imprese sociali, startup, associazioni non profit, cooperative) di dimostrare con rigore il valore sociale/ambientale creato, facilitando l&apos;istruttoria e la delibera dei sostenitori (PA, banche, fondazioni e fondi ad impatto).
                </p>
              </div>
            </div>
          </Card>

          {/* Module 1: Introduzione ed Obiettivi */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                1
              </span>
              <h3 className="text-lg font-bold text-slate-900">Introduzione ed Obiettivi del Framework IMP</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Il framework <strong>Impact Management Project (IMP)</strong> nasce dal consenso globale di oltre <strong>2.000 esperti ed investitori</strong> per standardizzare la misurazione, gestione e rendicontazione dell&apos;impatto sociale e ambientale lungo l&apos;intera catena del valore.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="font-bold text-emerald-900 text-sm mb-1">1. Template di raccolta e monitoraggio</div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Serve alle organizzazioni per raccogliere in modo ordinato i dati grezzi, le fonti e le metriche di esito generate per ciascun gruppo di beneficiari.
                </p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
                <div className="font-bold text-sky-900 text-sm mb-1">2. Checklist diagnostica per sostenitori</div>
                <p className="text-xs text-sky-800 leading-relaxed">
                  Garantisce la copertura analitica di tutte le 5 dimensioni essenziali prima che una Pubblica Amministrazione o un investitore attribuisca una delibera o una classificazione d&apos;impatto.
                </p>
              </div>
            </div>
          </Card>

          {/* Module 2: Architettura della Matrice (4 Colonne + Target) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                2
              </span>
              <h3 className="text-lg font-bold text-slate-900">Architettura della Matrice di Rilevazione (Le 4 Colonne Operative)</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Per ciascuna delle 15 categorie dati, l&apos;IMP raccomanda di compilare <strong>quattro colonne informative</strong> fondamentali:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-3 border-b border-slate-200">Colonna</th>
                    <th className="p-3 border-b border-slate-200">Descrizione Operativa</th>
                    <th className="p-3 border-b border-slate-200">Tipologia Dati &amp; Esempi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Indicator (Indicatore)</td>
                    <td className="p-3 text-slate-700">La metrica o metrica-proxy prescelta (standard o qualitativa) per quantificare l&apos;esito.</td>
                    <td className="p-3 font-mono text-slate-600">% miglioramento reddito, visite settimanali, tasso di superamento anno</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Data (Dati Grezzi)</td>
                    <td className="p-3 text-slate-700">Il dato puntuale consuntivo rilevato nel periodo di riferimento.</td>
                    <td className="p-3 font-mono text-slate-600">+35%, 1.3 visite/settimana, 60% intervistati, 85 beneficiari</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Source (Fonte)</td>
                    <td className="p-3 text-slate-700">La fonte della rilevazione (distinguendo tra dati <em>Self-Reported</em> e <em>Non-Self-Reported</em>).</td>
                    <td className="p-3 font-mono text-slate-600">Customer Survey Q2, Registro Presenze, DB Gestionale, ISTAT</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Assessment (Valutazione)</td>
                    <td className="p-3 text-slate-700">Il giudizio standardizzato di performance basato sulla combinazione dei dati rispetto al benchmark.</td>
                    <td className="p-3 font-mono text-emerald-700">Positive, Underserved, Deep change, Likely better, Low risk</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              📌 <strong>Nota di Gestione Interna:</strong> L&apos;IMP raccomanda di affiancare sempre una colonna opzionale <strong>Target</strong> per misurare lo scostamento continuo rispetto agli obiettivi strategici concordati con il finanziatore.
            </div>
          </Card>

          {/* Module 3: Le 5 Dimensioni nel Dettaglio */}
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                3
              </span>
              <h3 className="text-lg font-bold text-slate-900">Le 5 Dimensioni e le 15 Categorie Dati: Compilazione Guidata</h3>
            </div>

            <div className="grid gap-6">
              {/* Dim 1 */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-900 text-sm">DIMENSIONE 1: WHAT (Quali esiti si generano e quanto contano)</h4>
                  <Badge className="bg-emerald-100 text-emerald-800">Cat. 1 - 4</Badge>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Identifica i cambiamenti (positivi o negativi, intenzionali o inattesi) vissuti dallo stakeholder e la loro rilevanza prioritaria:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  <li><strong>1. Outcome level in period (i):</strong> Livello di esito registrato nel periodo (Rilevazione survey con domande aperte/scala Likert; Assessment: <code>Positive</code> / <code>Negative</code>).</li>
                  <li><strong>2. Outcome threshold:</strong> Soglia minima affinché l&apos;esito sia considerato positivo (standard nazionali/internazionali o soglia di dignità).</li>
                  <li><strong>3. Importance to stakeholder:</strong> Quanto l&apos;esito è prioritario per chi lo vive rispetto ad altri aspetti della propria vita.</li>
                  <li><strong>4. SDG target:</strong> Mappatura puntuale sugli Obiettivi ONU 2030 (Assessment: <code>Important</code> / <code>Unimportant</code>).</li>
                </ul>
              </div>

              {/* Dim 2 */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-900 text-sm">DIMENSIONE 2: WHO (Chi vive l&apos;esito e quanto è vulnerabile)</h4>
                  <Badge className="bg-blue-100 text-blue-800">Cat. 5 - 8</Badge>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Definisce il profilo dei beneficiari e il loro livello di bisogno pre-esistente (*baseline*):
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  <li><strong>5. Stakeholder:</strong> Segmento coinvolto (Clienti, dipendenti svantaggiati, fornitori etici, pianeta/ambiente).</li>
                  <li><strong>6. Geographical Boundary:</strong> Territorio in cui si manifesta l&apos;impatto (quartieri periferici, comuni rurali, bacino regionale).</li>
                  <li><strong>7. Outcome level at baseline (ii):</strong> Condizione di partenza prima dell&apos;intervento (Assessment: <code>Underserved</code> [sottoservito/vulnerabile] o <code>Well-served</code>).</li>
                  <li><strong>8. Stakeholder characteristics:</strong> Variabili socio-demografiche (genere, età, fascia ISEE) per disaggregare le risposte.</li>
                </ul>
              </div>

              {/* Dim 3 */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-purple-900 text-sm">DIMENSIONE 3: HOW MUCH (Entità, profondità e durata del cambiamento)</h4>
                  <Badge className="bg-purple-100 text-purple-800">Cat. 9 - 11</Badge>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Misura la significatività quantitativa, qualitativa e temporale dell&apos;impatto:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  <li><strong>9. Scale:</strong> Numero assoluto di persone raggiunte (Assessment: <code>Large scale</code> / <code>Small scale</code>).</li>
                  <li><strong>10. Depth:</strong> Grado di trasformazione, calcolato come delta tra baseline *(Who - ii)* e periodo *(What - i)* (Assessment: <code>Deep change</code> / <code>Marginal change</code>).</li>
                  <li><strong>11. Duration:</strong> Orizzonte temporale di persistenza del beneficio (Assessment: <code>Long term</code> / <code>Short term</code>).</li>
                </ul>
              </div>

              {/* Dim 4 */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-900 text-sm">DIMENSIONE 4: CONTRIBUTION (Addizionalità rispetto allo scenario controfattuale)</h4>
                  <Badge className="bg-amber-100 text-amber-800">Cat. 12 - 13</Badge>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Valuta quanto del cambiamento sarebbe avvenuto comunque, anche senza l&apos;intervento dell&apos;attuatore (evitando il cd. &quot;effetto inerzia&quot;):
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  <li><strong>12. Depth counterfactual:</strong> Stima della variazione in assenza dell&apos;attività tramite benchmark di mercato o gruppo di controllo (Assessment: <code>Likely better</code> / <code>Likely worse</code>).</li>
                  <li><strong>13. Duration counterfactual:</strong> Stima di quanto a lungo l&apos;esito sarebbe durato comunque in assenza dell&apos;intervento (Assessment: <code>Likely better</code> / <code>Likely worse</code>).</li>
                </ul>
              </div>

              {/* Dim 5 & 9 Risks */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-rose-900 text-sm">DIMENSIONE 5: RISK (I 9 Rischi di Impatto Codificati dall&apos;IMP)</h4>
                  <Badge className="bg-rose-100 text-rose-800">Cat. 14 - 15</Badge>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Analizza la probabilità e la gravità che l&apos;impatto effettivo sia inferiore o contrario rispetto alle attese. I 9 rischi codificati sono:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  {IMP_RISK_TYPES.map((rt) => (
                    <div key={rt.value} className="rounded-lg bg-white border border-rose-200 p-2 text-xs">
                      <strong className="text-rose-900 block font-bold">{rt.value}</strong>
                      <span className="text-[11px] text-slate-600">{rt.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Module 4: Fonti Self-Reported vs Non-Self-Reported */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                4
              </span>
              <h3 className="text-lg font-bold text-slate-900">Integrazione dei Dati: Self-Reported vs Non-Self-Reported</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Il report metodologico evidenzia che la <strong>massima accuratezza per i sostenitori</strong> si ottiene integrando dati diretti soggettivi (survey ai beneficiari) e dati oggettivi d&apos;esercizio (registri, contratti, statistiche territoriali).
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <strong className="text-xs uppercase tracking-wider text-slate-900">Dati Self-Reported (Survey Dirette)</strong>
                <p className="text-xs text-slate-600">
                  Indispensabili per le dimensioni <strong>WHAT</strong> (percezione e importanza dell&apos;esito) e <strong>WHO</strong> (vulnerabilità iniziale percepita).
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <strong className="text-xs uppercase tracking-wider text-slate-900">Dati Non-Self-Reported (Fonti Oggettive)</strong>
                <p className="text-xs text-slate-600">
                  Fondamentali per <strong>HOW MUCH</strong> (numero presenze, contratti firmati) e <strong>CONTRIBUTION</strong> (dati statistici ufficiali ISTAT/ANPAL/Eurostat).
                </p>
              </div>
            </div>
          </Card>

          {/* Module 5: Classificazione A, B, C */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                5
              </span>
              <h3 className="text-lg font-bold text-slate-900">Le 3 Classi di Impatto IMP (A · B · C)</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Al termine della compilazione, ciascun impatto e l&apos;organizzazione nel suo complesso vengono posizionati in una delle tre categorie globali:
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
                <div className="inline-flex items-center gap-1 rounded bg-amber-200 px-2 py-0.5 text-xs font-black text-amber-900">
                  CLASSE A
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Act to avoid harm</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  L&apos;organizzazione opera per mitigare i rischi ESG e prevenire impatti negativi su dipendenti, comunità e ambiente.
                </p>
              </div>

              <div className="rounded-xl border border-sky-300 bg-sky-50 p-4 space-y-2">
                <div className="inline-flex items-center gap-1 rounded bg-sky-200 px-2 py-0.5 text-xs font-black text-sky-900">
                  CLASSE B
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Benefit stakeholders</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  L&apos;organizzazione genera benefici tangibili e diretti per i propri stakeholder primari migliorandone la qualità della vita.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 space-y-2">
                <div className="inline-flex items-center gap-1 rounded bg-emerald-200 px-2 py-0.5 text-xs font-black text-emerald-900">
                  CLASSE C
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Contribute to solutions</h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  L&apos;organizzazione affronta sfide sociali/ambientali complesse a beneficio di popolazioni gravemente sottoservite (alta addizionalità).
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">
              ⚠️ <strong>Regola IMP di Cautela:</strong> Se non esistono dati sufficienti per tutte le 5 dimensioni per tutti gli stakeholder chiave, l&apos;organizzazione non può qualificarsi come &quot;B&quot; o &quot;C&quot; poiché potrebbe generare impatti negativi non rilevati.
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REPORT ESECUTIVO DI PRE-QUALIFICAZIONE PER I SOSTENITORI          */}
      {/* ========================================================================= */}
      {activeTab === "REPORT_SOSTENITORI" && (
        <div className="space-y-6 print:space-y-4 print:text-black">
          {/* Printable Supporters Header */}
          <Card className="p-6 border-slate-300 bg-white">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-black text-white">
                    {currentAssessment.code} · SUPPORTER SCORECARD
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Framework IMP Valido
                  </span>
                </div>
                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  {currentAssessment.assessmentTitle}
                </h2>
                <p className="text-xs text-slate-500">
                  Attuatore: <strong>{profile.name}</strong> ({ATTUATOR_TYPE_LABELS[profile.type]}) · Sostenitore: <strong>{TARGET_SUPPORTER_LABELS[profile.targetSupporter]}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                >
                  <Printer className="h-4 w-4" />
                  Stampa / Salva in PDF
                </button>
              </div>
            </div>

            {/* Entity Summary Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Attuatore</span>
                <div className="mt-1 font-bold text-slate-900 text-sm">{profile.name}</div>
                <div className="text-[11px] text-slate-500">{ATTUATOR_TYPE_LABELS[profile.type]}</div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Classificazione Complessiva</span>
                <div className="mt-1 font-bold text-emerald-700 text-sm">
                  Classe {CLASSIFICATION_INFO[profile.overallClassification].code} · {CLASSIFICATION_INFO[profile.overallClassification].english}
                </div>
                <div className="text-[11px] text-slate-500">{CLASSIFICATION_INFO[profile.overallClassification].label}</div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Territorio &amp; Settore</span>
                <div className="mt-1 font-bold text-slate-900">{profile.territory}</div>
                <div className="text-[11px] text-slate-500">{profile.sector}</div>
              </div>

              <div className={cn("rounded-lg p-3 border", supporterEligibility.border, supporterEligibility.bg)}>
                <span className="text-[10px] font-bold uppercase text-slate-500">Giudizio Istruttorio</span>
                <div className={cn("mt-1 font-bold text-sm", supporterEligibility.statusColor)}>
                  {supporterEligibility.verdict}
                </div>
                <div className="text-[11px] font-medium text-slate-600">{supporterEligibility.label}</div>
              </div>
            </div>

            {/* Coverage Status Bar if incomplete */}
            {coveredDimensionsCount < 5 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold">
                  <Info className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Attenzione all'istruttoria: {supporterEligibility.label}</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-800">
                  Per raggiungere la massima classe di bancabilità (Completo 5/5), completa i dati per le dimensioni non ancora compilate:{" "}
                  <strong>
                    {[
                      !dimensionCoverage.WHAT && "1. WHAT",
                      !dimensionCoverage.WHO && "2. WHO",
                      !dimensionCoverage.HOW_MUCH && "3. HOW MUCH",
                      !dimensionCoverage.CONTRIBUTION && "4. CONTRIBUTION",
                      !dimensionCoverage.RISK && "5. RISK",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </strong>.
                </p>
              </div>
            )}
          </Card>

          {/* Breakdown per Impact Table with all rows */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Quadro Sinottico delle 5 Dimensioni per Ciascun Impatto ({impacts.length} Obiettivi)
            </h3>

            {impacts.map((imp, idx) => {
              const whatRows = imp.rows.filter((r) => r.categoryId >= 1 && r.categoryId <= 4);
              const whoRows = imp.rows.filter((r) => r.categoryId >= 5 && r.categoryId <= 8);
              const howMuchRows = imp.rows.filter((r) => r.categoryId >= 9 && r.categoryId <= 11);
              const contributionRows = imp.rows.filter((r) => r.categoryId >= 12 && r.categoryId <= 13);
              const riskRows = imp.rows.filter((r) => r.categoryId >= 14 && r.categoryId <= 15);

              return (
                <Card key={imp.id} className="p-5 border-slate-200 space-y-4">
                  <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 md:flex-row md:items-center">
                    <div>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">
                        IMPATTO {idx + 1}
                      </span>
                      <h4 className="mt-1 text-base font-bold text-slate-900">{imp.title}</h4>
                      <p className="text-xs text-slate-600">{imp.description}</p>
                    </div>

                    <span className={cn("self-start rounded-md border px-3 py-1 text-xs font-bold md:self-auto", CLASSIFICATION_INFO[imp.classification].badgeCls)}>
                      Classe {CLASSIFICATION_INFO[imp.classification].code}: {CLASSIFICATION_INFO[imp.classification].label}
                    </span>
                  </div>

                  {/* 5 Dimension Pillars Grid showing all rows */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 text-xs">
                    {/* WHAT */}
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                      <span className="font-bold text-emerald-900 block">1. WHAT ({whatRows.length} metriche)</span>
                      {whatRows.map((r) => (
                        <div key={r.rowId} className="border-b border-emerald-200/60 pb-1.5 last:border-0 last:pb-0">
                          <div className="text-[11px] font-semibold text-slate-800">{r.indicator || "Esito"}</div>
                          <div className="text-[10px] text-slate-600">{r.data || "—"}</div>
                          {r.assessment && <Badge className="bg-emerald-100 text-emerald-800 mt-1 text-[10px]">{r.assessment}</Badge>}
                        </div>
                      ))}
                    </div>

                    {/* WHO */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                      <span className="font-bold text-blue-900 block">2. WHO ({whoRows.length} segmenti)</span>
                      {whoRows.map((r) => (
                        <div key={r.rowId} className="border-b border-blue-200/60 pb-1.5 last:border-0 last:pb-0">
                          <div className="text-[11px] font-semibold text-slate-800">{r.indicator || "Target"}</div>
                          <div className="text-[10px] text-slate-600">{r.data || "—"}</div>
                          {r.assessment && <Badge className="bg-blue-100 text-blue-800 mt-1 text-[10px]">{r.assessment}</Badge>}
                        </div>
                      ))}
                    </div>

                    {/* HOW MUCH */}
                    <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3 space-y-2">
                      <span className="font-bold text-purple-900 block">3. HOW MUCH ({howMuchRows.length} parametri)</span>
                      {howMuchRows.map((r) => (
                        <div key={r.rowId} className="border-b border-purple-200/60 pb-1.5 last:border-0 last:pb-0">
                          <div className="text-[11px] font-semibold text-slate-800">{r.indicator || "Scala/Profondità"}</div>
                          <div className="text-[10px] text-slate-600">{r.data || "—"}</div>
                          {r.assessment && <Badge className="bg-purple-100 text-purple-800 mt-1 text-[10px]">{r.assessment}</Badge>}
                        </div>
                      ))}
                    </div>

                    {/* CONTRIBUTION */}
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
                      <span className="font-bold text-amber-900 block">4. CONTRIBUTION ({contributionRows.length} controfattuali)</span>
                      {contributionRows.map((r) => (
                        <div key={r.rowId} className="border-b border-amber-200/60 pb-1.5 last:border-0 last:pb-0">
                          <div className="text-[11px] font-semibold text-slate-800">{r.indicator || "Addizionalità"}</div>
                          <div className="text-[10px] text-slate-600">{r.data || "—"}</div>
                          {r.assessment && <Badge className="bg-amber-100 text-amber-800 mt-1 text-[10px]">{r.assessment}</Badge>}
                        </div>
                      ))}
                    </div>

                    {/* RISK */}
                    <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 space-y-2">
                      <span className="font-bold text-rose-900 block">5. RISK ({riskRows.length} rischi presidiati)</span>
                      {riskRows.map((r) => (
                        <div key={r.rowId} className="border-b border-rose-200/60 pb-1.5 last:border-0 last:pb-0">
                          <div className="text-[11px] font-semibold text-rose-950 truncate">{r.indicator || "Rischio"}</div>
                          <div className="text-[10px] text-slate-600">{r.data || "—"}</div>
                          <div className="flex items-center gap-1 mt-1">
                            {r.assessment && <Badge className="bg-rose-100 text-rose-800 text-[10px]">{r.assessment}</Badge>}
                            {r.target && <span className="text-[9px] text-slate-500 truncate">🛡️ {r.target}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Sostenitore Recommendation Card */}
          <Card className="p-6 bg-slate-900 text-white space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emerald-400" />
              <h4 className="text-base font-bold">Parere Conclusivo per {TARGET_SUPPORTER_LABELS[profile.targetSupporter]}</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              La proposta di impatto presentata da <strong>{profile.name}</strong> soddisfa tutti i requisiti di tracciabilità metodologica IMP con analisi multi-fattoriale e presidio dei rischi dichiarati.
            </p>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
                <strong className="text-emerald-400 block mb-1">Per la Pubblica Amministrazione</strong>
                <span>Ammissibilità a contratti a impatto (Social Impact Bond) e co-progettazioni ex art. 55 Codice Terzo Settore.</span>
              </div>
              <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
                <strong className="text-sky-400 block mb-1">Per Investitori e Banche</strong>
                <span>Bancabilità dell&apos;operazione in logica Blended Finance con premi di rendimento legati a KPI certificati.</span>
              </div>
              <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
                <strong className="text-amber-400 block mb-1">Per Fondazioni &amp; Corporate CSR</strong>
                <span>Piena rendicontabilità ESG (CSRD / ESRS) e massimizzazione del ritorno sociale sull&apos;investimento (SROI).</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLONE / ADD ASSESSMENT                                            */}
      {/* ========================================================================= */}
      {showCloneModal && (
        <Modal title="Aggiungi / Clona Assessment per un Attuatore" onClose={() => setShowCloneModal(false)} wide>
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <p className="text-xs text-emerald-900 leading-relaxed">
                <strong>Clonazione Strutturata:</strong> Questa operazione crea una nuova istanza distinta nel sistema, con un proprio codice univoco, pronta per essere personalizzata per qualsiasi attuatore (impresa sociale, non profit, startup) e per i rispettivi sostenitori.
              </p>
            </div>

            {/* Modalità di clonazione */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Modalità di Creazione
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 transition",
                    cloneMode === "COPY_CURRENT"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-200"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  )}
                >
                  <input
                    type="radio"
                    name="cloneMode"
                    checked={cloneMode === "COPY_CURRENT"}
                    onChange={() => setCloneMode("COPY_CURRENT")}
                    className="text-emerald-600"
                  />
                  <div>
                    <div>Clona Matrice Corrente</div>
                    <div className="text-[11px] font-normal text-slate-500">Copia tutti gli impatti, righe e dati dell&apos;assessment attivo</div>
                  </div>
                </label>

                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 transition",
                    cloneMode === "BLANK_TEMPLATE"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-200"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  )}
                >
                  <input
                    type="radio"
                    name="cloneMode"
                    checked={cloneMode === "BLANK_TEMPLATE"}
                    onChange={() => setCloneMode("BLANK_TEMPLATE")}
                    className="text-emerald-600"
                  />
                  <div>
                    <div>Nuovo da Template IMP</div>
                    <div className="text-[11px] font-normal text-slate-500">Inizializza con i 2 impatti standard vuoti</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Titolo distintivo */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Titolo Distintivo dell&apos;Assessment <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={cloneFormTitle}
                onChange={(e) => setCloneFormTitle(e.target.value)}
                placeholder="Es. Valutazione Bando Welfare 2026 · Cooperativa Rinascita"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
              />
              <span className="text-[11px] text-slate-500">Questo titolo permetterà di distinguere chiaramente la valutazione dalle altre nel database.</span>
            </div>

            {/* Denominazione Attuatore */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Denominazione Soggetto Attuatore
              </label>
              <input
                type="text"
                value={cloneFormAttuatorName}
                onChange={(e) => setCloneFormAttuatorName(e.target.value)}
                placeholder="Es. Cooperativa Sociale Rinascita ETS"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipologia Soggetto Attuatore
                </label>
                <select
                  value={cloneFormType}
                  onChange={(e) => setCloneFormType(e.target.value as AttuatorType)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="IMPRESA_SOCIALE">Impresa Sociale (D.Lgs. 112/2017)</option>
                  <option value="STARTUP_INNOVATIVA_IMPATTO">Startup Innovativa a Vocazione Sociale</option>
                  <option value="ASSOCIAZIONE_NON_PROFIT">Associazione / Organizzazione Non Profit</option>
                  <option value="COOPERATIVA_SOCIALE">Cooperativa Sociale (Tipo A / B)</option>
                  <option value="ENTE_TERZO_SETTORE">Ente del Terzo Settore (ETS)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sostenitore Target Primario
                </label>
                <select
                  value={cloneFormTargetSupporter}
                  onChange={(e) => setCloneFormTargetSupporter(e.target.value as TargetSupporterType)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="PA_PUBBLICA_AMMINISTRAZIONE">Pubblica Amministrazione (Bandi, Co-progettazione)</option>
                  <option value="IMPACT_INVESTOR">Investitore ad Impatto (Venture Philanthropy, ESG)</option>
                  <option value="IMPRESA_FINANZIATRICE_CSR">Impresa Finanziatrice / Corporate CSR</option>
                  <option value="FONDAZIONE_BANCARIA">Fondazione Erogativa / Ente Filantropico</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Settore di Intervento
                </label>
                <input
                  type="text"
                  value={cloneFormSector}
                  onChange={(e) => setCloneFormSector(e.target.value)}
                  placeholder="Es. Inclusione socio-lavorativa, rigenerazione urbana..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ambito Territoriale
                </label>
                <input
                  type="text"
                  value={cloneFormTerritory}
                  onChange={(e) => setCloneFormTerritory(e.target.value)}
                  placeholder="Es. Regione Campania / Comune di Napoli"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowCloneModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmClone}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
              >
                Crea e Attiva Assessment
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ATTUATOR PROFILE & ASSESSMENT TITLE                           */}
      {/* ========================================================================= */}
      {showProfileModal && (
        <Modal title="Modifica Titolo &amp; Profilo Attuatore" onClose={() => setShowProfileModal(false)} wide>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Titolo Distintivo Assessment
              </label>
              <input
                type="text"
                value={currentAssessment.assessmentTitle}
                onChange={(e) => {
                  const updatedList = assessments.map((a) =>
                    a.id === activeAssessmentId ? { ...a, assessmentTitle: e.target.value } : a
                  );
                  saveToStorage(updatedList);
                }}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Denominazione Attuatore
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateCurrentProfile({ ...profile, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-semibold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipologia Soggetto Attuatore
                </label>
                <select
                  value={profile.type}
                  onChange={(e) => updateCurrentProfile({ ...profile, type: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="IMPRESA_SOCIALE">Impresa Sociale (D.Lgs. 112/2017)</option>
                  <option value="STARTUP_INNOVATIVA_IMPATTO">Startup Innovativa a Vocazione Sociale</option>
                  <option value="ASSOCIAZIONE_NON_PROFIT">Associazione / Organizzazione Non Profit</option>
                  <option value="COOPERATIVA_SOCIALE">Cooperativa Sociale (Tipo A / B)</option>
                  <option value="ENTE_TERZO_SETTORE">Ente del Terzo Settore (ETS)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sostenitore Target di Riferimento
                </label>
                <select
                  value={profile.targetSupporter}
                  onChange={(e) => updateCurrentProfile({ ...profile, targetSupporter: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="PA_PUBBLICA_AMMINISTRAZIONE">Pubblica Amministrazione (Bandi, Co-progettazione)</option>
                  <option value="IMPACT_INVESTOR">Investitore ad Impatto (Venture Philanthropy, ESG)</option>
                  <option value="IMPRESA_FINANZIATRICE_CSR">Impresa Finanziatrice / Corporate CSR</option>
                  <option value="FONDAZIONE_BANCARIA">Fondazione Erogativa / Ente Filantropico</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Settore di Intervento
                </label>
                <input
                  type="text"
                  value={profile.sector}
                  onChange={(e) => updateCurrentProfile({ ...profile, sector: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ambito Territoriale
                </label>
                <input
                  type="text"
                  value={profile.territory}
                  onChange={(e) => updateCurrentProfile({ ...profile, territory: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Missione e Sintesi del Valore Sociale/Ambientale
              </label>
              <textarea
                rows={3}
                value={profile.mission}
                onChange={(e) => updateCurrentProfile({ ...profile, mission: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Classificazione Complessiva Organizzazione
              </label>
              <select
                value={profile.overallClassification}
                onChange={(e) => updateCurrentProfile({ ...profile, overallClassification: e.target.value as ImpactClassification })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-bold text-slate-800"
              >
                <option value="ACT_TO_AVOID_HARM">Classe A · Agire per evitare danni (Act to avoid harm)</option>
                <option value="BENEFIT_STAKEHOLDERS">Classe B · Generare benefici per gli stakeholder (Benefit stakeholders)</option>
                <option value="CONTRIBUTE_TO_SOLUTIONS">Classe C · Contribuire a soluzioni sistemiche (Contribute to solutions)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowProfileModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Chiudi
              </button>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  triggerNotification("Dati assessment aggiornati!");
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
