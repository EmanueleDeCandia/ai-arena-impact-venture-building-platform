import type {
  DocStatus,
  EvidenceStatus,
  ImpactCanvas,
  Instrument,
  OpportunityStatus,
  ProjectStatus,
  RaciItem,
  StakeholderType,
  ToC,
  TrancheStatus,
  TxType,
  UserRole,
} from "@/db/schema";

/** DTO serializzabili passati ai componenti client (RF-6 modello dati). */

export type UserDTO = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  orgName: string | null;
};

export type StakeholderDTO = {
  id: number;
  type: StakeholderType;
  orgName: string;
  contactName: string | null;
  commitment: string | null;
  commitmentValue: number;
  userId: number | null;
};

export type TrancheDTO = {
  id: number;
  instrument: Instrument;
  label: string;
  provider: string | null;
  amount: number;
  ratePct: number;
  maturityMonths: number;
  guaranteePct: number;
  waterfallOrder: number;
  conditions: string | null;
  status: TrancheStatus;
};

export type KpiDTO = {
  id: number;
  code: string;
  title: string;
  unit: string;
  baseline: number;
  target: number;
  current: number;
  valuePerUnit: number;
  verificationMethod: string | null;
  timelineMonths: number;
  sdg: string | null;
};

export type EvidenceDTO = {
  id: number;
  kpiId: number;
  kpiTitle: string;
  title: string;
  type: string;
  value: number;
  fileRef: string | null;
  status: EvidenceStatus;
  submittedBy: number | null;
  submittedByName: string | null;
  validatorNote: string | null;
  submittedAt: string;
  validatedAt: string | null;
};

export type DocDTO = {
  id: number;
  title: string;
  category: string;
  sizeKb: number;
  status: DocStatus;
  uploadedByName: string | null;
  uploadedAt: string;
};

export type TxDTO = {
  id: number;
  type: TxType;
  fromEntity: string;
  toEntity: string;
  amount: number;
  note: string | null;
  hash: string;
  trancheLabel: string | null;
  date: string;
};

export type TokenDTO = {
  id: number;
  kpiId: number | null;
  amount: number;
  description: string;
  issuedAt: string;
};

export type CommentDTO = {
  id: number;
  userName: string;
  section: string;
  text: string;
  createdAt: string;
};

export type OpportunityDTO = {
  id: number;
  title: string;
  description: string;
  territory: string;
  commune: string | null;
  gravity: number;
  populationTarget: string | null;
  assets: string | null;
  source: string;
  economicPotential: number;
  opportunityScore: number;
  suggestedStakeholders: string[] | null;
  status: OpportunityStatus;
  createdAt: string;
};

export type ProjectDTO = {
  id: number;
  name: string;
  tagline: string | null;
  description: string | null;
  territory: string;
  commune: string | null;
  status: ProjectStatus;
  sdgTags: string[] | null;
  toc: ToC;
  impactCanvas: ImpactCanvas;
  raci: RaciItem[];
  fundingNeed: number;
  annualRevenue: number;
  annualOpex: number;
  localSupplierPct: number;
  lm3: number;
  fteCreated: number;
  creditScore: number;
  impactScore: number;
  taxonomyAlignmentPct: number;
  sfdrCategory: string;
  dnshOk: boolean;
  expectedLossPct: number;
  createdAt: string;
  updatedAt: string;
  originatorName: string | null;
  opportunityTitle: string | null;
  stakeholders: StakeholderDTO[];
  tranches: TrancheDTO[];
  kpis: KpiDTO[];
  evidences: EvidenceDTO[];
  documents: DocDTO[];
  transactions: TxDTO[];
  tokens: TokenDTO[];
  comments: CommentDTO[];
};

export type ProjectListItemDTO = {
  id: number;
  name: string;
  tagline: string | null;
  territory: string;
  status: ProjectStatus;
  sdgTags: string[] | null;
  createdAt: string;
  stakeholderCount: number;
  fundingTotal: number;
  kpiAvgProgress: number;
};

export const EMPTY_TOC: ToC = {
  inputs: [],
  activities: [],
  outputs: [],
  outcomes: [],
  impacts: [],
  validated: false,
};

export const EMPTY_CANVAS: ImpactCanvas = {
  costStructure: [],
  revenueStreams: [],
  payingBeneficiaries: "",
  nonPayingBeneficiaries: "",
  keyPartners: [],
  keyResources: [],
};
