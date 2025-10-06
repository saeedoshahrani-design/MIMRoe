

export interface Activity {
    description: string;
    weight: 1 | 2 | 3 | 4 | 5;
    is_completed: boolean;
}

export interface Challenge {
    type: 'challenge';
    id: string; // For React key and client-side identification
    code: string;
    title_ar: string;
    title_en: string;
    description: string;
    status: 'جديد' | 'قيد المعالجة' | 'قيد المراجعة' | 'مغلق';
    priority: 'عالي' | 'متوسط' | 'منخفض';
    category: 'تشغيلي' | 'تقني' | 'حوكمة' | 'موارد بشرية' | 'تنظيمي' | 'خارجي';
    impact: 'منخفض' | 'متوسط' | 'مرتفع';
    effort: 'منخفض' | 'متوسط' | 'مرتفع';
    priority_category: 'quick_wins' | 'major_projects' | 'small_quick_wins' | 'not_worth_it';
    priority_score: number;
    progress_notes: string;
    remediation_plan: string;
    requirements_enablers: string;
    activities: Activity[];
    department: string;
    start_date: string;
    target_date: string;
    created_at: string;
    updated_at: string;
    is_archived: boolean;
    linkedTargetIds?: string[];
    // Optional properties for Gantt calculation
    actual_percent?: number;
    planned_percent_today?: number;
}

export type OpportunityStatus = 'Under Review' | 'In Progress' | 'Implemented' | 'On Hold';

export type OpportunityPriority = 'عالي' | 'متوسط' | 'منخفض';

export interface Opportunity {
    type: 'opportunity';
    id: string;
    code: string;
    title: string;
    department: string;
    status: OpportunityStatus;
    impact: 'منخفض' | 'متوسط' | 'مرتفع';
    effort: 'منخفض' | 'متوسط' | 'مرتفع';
    priority: OpportunityPriority;
    priority_category: 'quick_wins' | 'major_projects' | 'small_quick_wins' | 'not_worth_it';
    priority_score: number;
    currentSituation: string;
    proposedSolution: string;
    progress: number;
    owner?: string;
    startDate?: string;
    dueDate?: string;
    notes?: string;
    linkedTargetIds?: string[];
    createdAt: string;
    updatedAt: string;
}

export type Initiative = Challenge | Opportunity;

export interface Department {
    id: string;
    name: { en: string; ar: string; };
}

export interface Employee {
  id: string;
  name: { en: string; ar: string };
  title: { en: string; ar: string };
  department: { en: string; ar: string };
  avatar: string; // URL or empty string for placeholder
  joinDate: string; // ISO 8601 format
  experienceYears: number;
  qualifications: { en: string[]; ar: string[] };
  certifications: { en: string[]; ar: string[] };
  trainingCourses: { en: string[]; ar: string[] };
  tasks: { en: string[]; ar:string[] };
  achievements: { en: string[]; ar: string[] };
}

export type LocalizedString = {
  ar: string;
  en: string;
};

export interface ProcedureFormFile {
  name: string;
  type: string;
  content: string; // base64 encoded
}

export interface ProcedureForm {
  name: LocalizedString;
  file: ProcedureFormFile;
}

export interface Definition {
  id: string; // For client-side key
  term: LocalizedString;
  definition: LocalizedString;
}

export interface Kpi {
  name: LocalizedString;
  target: LocalizedString;
  description: LocalizedString;
}

export interface Procedure {
  id: string;
  code: string;
  title: LocalizedString;
  description: LocalizedString;
  inputs: LocalizedString;
  outputs: LocalizedString;
  policiesAndReferences?: LocalizedString;
  technicalSystems?: LocalizedString;
  formsUsed?: ProcedureForm[];
  definitions?: Definition[];
  kpi?: Kpi;
  departmentId: string;
  linkedService?: LocalizedString;
  durationDays?: number;
  eReadiness: 'electronic' | 'partially-electronic' | 'not-electronic';
  createdAt: string;
  updatedAt: string;
}


export type PerformanceStatus = 'onTrack' | 'behind' | 'ahead';

export interface DashboardFilters {
  timeRange: 'all' | '30' | '90' | 'custom';
  customDateRange: {
    start: string | null;
    end: string | null;
  };
  selectedDepartments: string[];
  selectedStatuses: Challenge['status'][];
  selectedPerformance: PerformanceStatus[];
  searchTerm: string;
}

export interface OpportunityDashboardFilters {
    searchTerm: string;
    selectedDepartments: string[];
    selectedStatuses: OpportunityStatus[];
    dateRange: {
        start: string | null;
        end: string | null;
    };
}
export interface DepartmentTask {
    id: string;
    description: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export type TargetUnit = 'percentage' | 'number' | 'days';
export type TargetStatus = 'onTrack' | 'atRisk' | 'behind';

export interface DepartmentTarget {
    id: string;
    name: string;
    description: string;
    unit: TargetUnit;
    baseline: number;
    current: number;
    target: number;
    dueDate: string | null;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface DepartmentData {
    tasks: DepartmentTask[];
    targets: DepartmentTarget[];
}


// Business Timeline Types
export type TaskSource = 'linked' | 'manual';

export interface TimelineTask {
  id: string;
  seq: number;
  title: string;
  code?: string;
  department?: string;
  start: string | Date;
  end: string | Date;
  actual_percent: number;
  planned_percent_today?: number;
  status: Challenge['status']; // Using Challenge status as the canonical one for color mapping
  source: TaskSource;
  description?: string;
}

// Lead Tasks Types
export interface LeadTask {
  id: string;
  text: string;
}

export type LeadTaskCategory = 'strategic' | 'communication' | 'development' | 'operational' | 'additional';

export interface LeadTasksData {
  leaderName: string;
  leaderPhoto: string;
  tasks: Record<LeadTaskCategory, LeadTask[]>;
}