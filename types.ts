// A string that can be in either Arabic or English
export type LocalizedString = {
    en: string;
    ar: string;
};

// A list of strings that can be in either Arabic or English
export type LocalizedStringArray = {
    en: string[];
    ar: string[];
};

export interface Activity {
    description: string;
    weight: 1 | 2 | 3 | 4 | 5;
    is_completed: boolean;
}

export type PriorityValue = 'منخفض' | 'متوسط' | 'مرتفع';

export type PriorityCategory = 'quick_wins' | 'major_projects' | 'small_quick_wins' | 'not_worth_it';

export interface Challenge {
    type: 'challenge';
    id: string;
    code: string;
    title: string;
    description: string;
    status: 'جديد' | 'قيد المعالجة' | 'قيد المراجعة' | 'مغلق';
    priority: 'منخفض' | 'متوسط' | 'عالي';
    category: 'تشغيلي' | 'تقني' | 'حوكمة' | 'موارد بشرية' | 'تنظيمي' | 'خارجي';
    impact: PriorityValue;
    effort: PriorityValue;
    priority_category: PriorityCategory;
    priority_score: number;
    progress_notes: string;
    remediation_plan: string;
    requirements_enablers: string;
    activities: Activity[];
    department: string; // Arabic department name
    start_date: string; // ISO date string YYYY-MM-DD
    target_date: string; // ISO date string YYYY-MM-DD
    created_at: string; // ISO datetime string
    updated_at: string; // ISO datetime string
    is_archived: boolean;
    linkedTargetIds?: string[];
    actual_percent?: number; // Calculated for Gantt
    planned_percent_today?: number; // Calculated for Gantt
}

export type OpportunityStatus = 'Under Review' | 'In Progress' | 'Implemented' | 'On Hold';

export interface Opportunity {
    type: 'opportunity';
    id: string;
    code: string;
    title: LocalizedString;
    department: string; // Arabic department name
    status: OpportunityStatus;
    impact: PriorityValue;
    effort: PriorityValue;
    priority: Challenge['priority'];
    priority_category: PriorityCategory;
    priority_score: number;
    currentSituation: LocalizedString;
    proposedSolution: LocalizedString;
    progress: number;
    owner: LocalizedString;
    startDate: string; // ISO date string YYYY-MM-DD
    dueDate: string; // ISO date string YYYY-MM-DD
    createdAt: string; // ISO datetime string
    updatedAt: string; // ISO datetime string
    notes?: string;
    linkedTargetIds?: string[];
    isAiGenerated?: boolean;
    linkedProcedureId?: string;
    linkedProcedureCode?: string;
    linkedProcedureTitle?: LocalizedString;
}

export type Initiative = Challenge | Opportunity;

export interface Department {
    id: string;
    name: LocalizedString;
    type: 'department' | 'directorate';
}

export type LeadTaskCategory = 'strategic' | 'communication' | 'development' | 'operational' | 'additional';

export interface LeadTask {
    id: string;
    text: LocalizedString;
}

export interface LeadTasksData {
    leaderName: LocalizedString;
    tasks: Record<LeadTaskCategory, LeadTask[]>;
}

export interface Employee {
    id: string;
    name: LocalizedString;
    title: LocalizedString;
    department: LocalizedString;
    avatar: string;
    joinDate: string; // ISO date string
    experienceYears: number;
    qualifications: LocalizedStringArray;
    certifications: LocalizedStringArray;
    trainingCourses: LocalizedStringArray;
    tasks: LocalizedStringArray;
    achievements: LocalizedStringArray;
}

export type EReadiness = 'electronic' | 'partially-electronic' | 'not-electronic';

export interface Kpi {
    id: string;
    name: LocalizedString;
    target: LocalizedString;
    description: LocalizedString;
    isAiGenerated?: boolean;
}

export interface AttachedFile {
    name: string;
    type: string; // Mime type
    content: string; // base64
}

export interface ProcedureForm {
    name: LocalizedString;
    file: AttachedFile;
}

export interface Definition {
    id: string;
    term: LocalizedString;
    definition: LocalizedString;
}

export interface ProcedureStep {
    id: string;
    stepName: string;
    description: string;
    department: string;
    responsible: string;
    durationHours: number;
    waitHours: number;
    waitDays: number;
    systemUsed: string;
}

export interface ChangeLogEntry {
    id: string;
    type: 'add' | 'edit' | 'delete';
    element: 'card' | 'steps' | 'kpis';
    description: string; // AI-generated or manual
    timestamp: string; // ISO string
    isManual?: boolean;
}

export interface Procedure {
    id: string;
    code: string;
    title: LocalizedString;
    description: LocalizedString;
    inputs: LocalizedString;
    outputs: LocalizedString;
    departmentId: string;
    eReadiness: EReadiness;
    createdAt: string;
    updatedAt: string;
    kpis: Kpi[];
    linkedTaskIds?: string[];
    linkedTargetIds?: string[];
    policiesAndReferences?: LocalizedString;
    technicalSystems?: LocalizedString;
    linkedService?: LocalizedString;
    durationDays?: number;
    formsUsed?: ProcedureForm[];
    definitions?: Definition[];
    steps?: ProcedureStep[];
    changeLog?: ChangeLogEntry[];
}

export type PerformanceStatus = 'ahead' | 'onTrack' | 'behind';

export interface DashboardFilters {
    timeRange: '30' | '90' | 'all' | 'custom';
    customDateRange: { start: string | null, end: string | null };
    selectedDepartments: string[];
    selectedStatuses: Challenge['status'][];
    selectedPerformance: PerformanceStatus[];
    searchTerm: string;
}

export interface OpportunityDashboardFilters {
    searchTerm: string;
    selectedDepartments: string[];
    selectedStatuses: OpportunityStatus[];
    dateRange: { start: string | null; end: string | null; };
}

export interface InitiativeDashboardFilters {
    searchTerm: string;
    selectedDepartments: string[];
    selectedPerformance: PerformanceStatus[];
    dateRange: { start: string | null; end: string | null; };
}

export interface DepartmentTask {
    id: string;
    description: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export type TargetUnit = 'percentage' | 'number' | 'currency' | 'days';
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
    status: Challenge['status'];
    source: 'linked' | 'manual';
    description?: string;
    assignee?: string;
}

export interface InitiativeAxis {
    id: string;
    text: LocalizedString;
}

export interface InitiativeMember {
    id: string;
    name: LocalizedString;
    role: LocalizedString;
    tasks: LocalizedString;
}

export interface InitiativeTask {
    id: string;
    seq: number;
    title: string;
    description: string;
    assignee: string;
    start: string; // ISO date string
    end: string; // ISO date string
    status: Challenge['status'];
    actual_percent: number;
}

export interface StrategicInitiative {
    id: string;
    name: LocalizedString;
    description: LocalizedString;
    owner: LocalizedString;
    associatedDepartments: string[]; // Arabic department names
    otherAssociatedDepartments: LocalizedString;
    outcomes: LocalizedString;
    strategicAlignment: LocalizedString;
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    members: InitiativeMember[];
    tasks: InitiativeTask[];
    axes: InitiativeAxis[];
    createdAt: string;
    updatedAt: string;
}