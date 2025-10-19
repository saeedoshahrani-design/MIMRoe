import { Challenge, Opportunity, Department, Activity, LeadTasksData, Employee, Procedure, LocalizedString } from '../types';

export const departments: Department[] = [
    { id: '1', name: { en: 'Land Approvals Department', ar: 'ادارة موافقات الاراضي' }, type: 'department' },
    { id: '2', name: { en: 'Land Allocation Operations Department', ar: 'ادارة عمليات تخصيص الاراضي' }, type: 'department' },
    { id: '3', name: { en: 'Land Affairs Department', ar: 'ادارة شؤون الاراضي' }, type: 'department' },
    { id: '4', name: { en: 'Land Regulation and Protection Department', ar: 'ادارة تنظيم وحماية الاراضي' }, type: 'department' },
    { id: '5', name: { en: 'Geospatial Data Department', ar: 'ادارة البيانات الجيومكانية' }, type: 'department' },
    { id: '6', name: { en: 'Land Objections Department', ar: 'ادارة اعتراضات الاراضي' }, type: 'department' },
    // Directorates
    { id: '7', name: { en: 'General Directorate for Land Allocation', ar: 'الادارة العامة لتخصيص الأراضي' }, type: 'directorate' },
    { id: '8', name: { en: 'General Directorate for Land Planning and Follow-up', ar: 'الادارة العامة لتخطيط ومتابعة الاراضي' }, type: 'directorate' },
];

const now = new Date().toISOString();

// This data is used ONLY to seed the database on the first run for a new user.
// It is not a live data source for the application components.
export const seedChallenges: Challenge[] = [
    {
        type: 'challenge',
        id: 'c1',
        code: 'CH01',
        title: 'انخفاض أرقام موافقات الربع الرابع',
        description: 'Approval figures for the last quarter were 15% below target, impacting annual goals.',
        status: 'قيد المعالجة',
        priority: 'عالي',
        category: 'تشغيلي',
        impact: 'مرتفع',
        effort: 'متوسط',
        priority_category: 'major_projects',
        priority_score: 3,
        progress_notes: 'Initial analysis of approval data completed. Key regions identified.',
        remediation_plan: 'Launch a targeted awareness campaign and introduce a new incentive program within 6 weeks.',
        requirements_enablers: 'Budget approval for campaign, collaboration with other departments.',
        activities: [
            { description: 'Develop new incentive structure', weight: 5, is_completed: true },
            { description: 'Create campaign assets', weight: 4, is_completed: false },
            { description: 'Train team on new promotions', weight: 3, is_completed: false },
        ],
        department: 'ادارة موافقات الاراضي',
        start_date: '2024-01-15',
        target_date: '2024-04-15',
        created_at: now,
        updated_at: now,
        is_archived: false,
    },
    {
        type: 'challenge',
        id: 'c2',
        code: 'CH02',
        title: 'ارتفاع معدل الاعتراضات',
        description: 'Customer objections have increased by 5% over the last two quarters, primarily due to poor response times.',
        status: 'جديد',
        priority: 'عالي',
        category: 'حوكمة',
        impact: 'مرتفع',
        effort: 'منخفض',
        priority_category: 'quick_wins',
        priority_score: 4,
        progress_notes: '',
        remediation_plan: 'Implement a new ticketing system and conduct refresher training for the team.',
        requirements_enablers: 'Selection of a software vendor, allocation of training hours.',
        activities: [
            { description: 'Evaluate and select a new ticketing system', weight: 5, is_completed: false },
            { description: 'Plan and execute team training', weight: 5, is_completed: false },
        ],
        department: 'ادارة عمليات تخصيص الاراضي',
        start_date: '2024-02-01',
        target_date: '2024-05-01',
        created_at: now,
        updated_at: now,
        is_archived: false,
    },
     {
        type: 'challenge',
        id: 'c3',
        code: 'CH03',
        title: 'بطء دورة تخصيص الأراضي',
        description: 'The average time-to-allocate for new requests is 9 months, which is slower than targets.',
        status: 'قيد المراجعة',
        priority: 'متوسط',
        category: 'تقني',
        impact: 'متوسط',
        effort: 'مرتفع',
        priority_category: 'major_projects',
        priority_score: 3,
        progress_notes: 'A review of the current allocation process has been completed.',
        remediation_plan: 'Transition the team to an Agile methodology (Scrum).',
        requirements_enablers: 'Hire a Scrum master, provide Agile training for the team.',
        activities: [
            { description: 'Conduct Agile/Scrum workshop for the team', weight: 4, is_completed: true },
            { description: 'Restructure teams into squads', weight: 5, is_completed: false },
        ],
        department: 'ادارة شؤون الاراضي',
        start_date: '2024-03-01',
        target_date: '2024-09-01',
        created_at: now,
        updated_at: now,
        is_archived: false,
    }
];

export const seedOpportunities: Opportunity[] = [
    {
        type: 'opportunity',
        id: 'op1',
        code: 'OP01',
        title: { en: 'Implement a new GIS system', ar: 'تطبيق نظام معلومات جغرافية جديد' },
        department: 'ادارة موافقات الاراضي',
        status: 'Under Review',
        impact: 'مرتفع',
        effort: 'مرتفع',
        priority: 'عالي',
        priority_category: 'major_projects',
        priority_score: 3,
        currentSituation: { en: 'Land data is tracked in spreadsheets, leading to lost opportunities and poor follow-up.', ar: 'يتم تتبع بيانات الأراضي في جداول بيانات، مما يؤدي إلى ضياع الفرص وضعف المتابعة.' },
        proposedSolution: { en: 'Adopt a modern GIS to centralize land data and automate workflows.', ar: 'اعتماد نظام معلومات جغرافية حديث لمركزية بيانات الأراضي وأتمتة سير العمل.' },
        progress: 10,
        owner: { en: 'Dept. Lead', ar: 'قائد الإدارة' },
        startDate: '2024-08-01',
        dueDate: '2025-02-01',
        createdAt: now,
        updatedAt: now,
    },
    {
        type: 'opportunity',
        id: 'op2',
        code: 'OP02',
        title: { en: 'Launch a public awareness program', ar: 'إطلاق برنامج توعية عام' },
        department: 'ادارة تنظيم وحماية الاراضي',
        status: 'In Progress',
        impact: 'متوسط',
        effort: 'متوسط',
        priority: 'متوسط',
        priority_category: 'small_quick_wins',
        priority_score: 2,
        currentSituation: { en: 'Low public engagement with new regulations.', ar: 'مشاركة جماهيرية منخفضة مع اللوائح الجديدة.' },
        proposedSolution: { en: 'Create a points-based program that rewards public for reporting infringements.', ar: 'إنشاء برنامج قائم على النقاط يكافئ الجمهور على الإبلاغ عن المخالفات.' },
        progress: 45,
        owner: { en: 'Dept. Manager', ar: 'مدير الإدارة' },
        startDate: '2024-06-15',
        dueDate: '2024-12-15',
        createdAt: now,
        updatedAt: now,
    },
];

export const seedLeadTasksData: LeadTasksData = {
  leaderName: { ar: 'قائد الفريق', en: 'Team Leader' },
  tasks: {
    strategic: [
      { id: 's1', text: { ar: 'تحديد الأهداف والنتائج الرئيسية الربعية (OKRs)', en: 'Define quarterly OKRs' } },
      { id: 's2', text: { ar: 'تحليل المشهد التنافسي', en: 'Analyze competitor landscape' } },
    ],
    communication: [
      { id: 'c1', text: { ar: 'عقد اجتماعات مزامنة أسبوعية للفريق', en: 'Hold weekly team syncs' } },
      { id: 'c2', text: { ar: 'رفع تقارير التقدم لأصحاب المصلحة', en: 'Report progress to stakeholders' } },
    ],
    development: [
      { id: 'd1', text: { ar: 'تنظيم ورش عمل لبناء المهارات', en: 'Organize skill-building workshops' } },
      { id: 'd2', text: { ar: 'إجراء اجتماعات فردية شهرية', en: 'Conduct monthly 1-on-1s' } },
    ],
    operational: [
      { id: 'o1', text: { ar: 'مراقبة مؤشرات الأداء الرئيسية للفريق', en: 'Monitor team KPIs' } },
      { id: 'o2', text: { ar: 'إزالة العوائق أمام الفريق', en: 'Unblock team impediments' } },
    ],
    additional: [
      { id: 'a1', text: { ar: 'الموافقة على طلبات الإجازة', en: 'Approve vacation requests' } },
    ],
  },
};

export const seedEmployees: Employee[] = [
    {
        id: 'emp1',
        name: { en: 'John Doe', ar: 'جون دو' },
        title: { en: 'Project Manager', ar: 'مدير المشروع' },
        department: { en: 'Land Allocation Operations Department', ar: 'ادارة عمليات تخصيص الاراضي' },
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        joinDate: '2022-03-15',
        experienceYears: 8,
        qualifications: {
            en: ['B.Sc. in Business Administration'],
            ar: ['بكالوريوس في إدارة الأعمال']
        },
        certifications: {
            en: ['PMP (Project Management Professional)'],
            ar: ['محترف إدارة المشاريع (PMP)']
        },
        trainingCourses: {
            en: ['Advanced Leadership Skills', 'Change Management'],
            ar: ['مهارات القيادة المتقدمة', 'إدارة التغيير']
        },
        tasks: {
            en: ['Lead the activation team', 'Monitor KPIs', 'Report to upper management'],
            ar: ['قيادة فريق التفعيل', 'مراقبة مؤشرات الأداء الرئيسية', 'رفع التقارير للإدارة العليا']
        },
        achievements: {
            en: ['Successfully launched 3 major projects', 'Improved team efficiency by 20%'],
            ar: ['أطلق بنجاح 3 مشاريع كبرى', 'حسن كفاءة الفريق بنسبة 20%']
        }
    },
    {
        id: 'emp2',
        name: { en: 'Jane Smith', ar: 'جين سميث' },
        title: { en: 'Data Analyst', ar: 'محلل بيانات' },
        department: { en: 'Land Objections Department', ar: 'ادارة اعتراضات الاراضي' },
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        joinDate: '2023-01-20',
        experienceYears: 4,
        qualifications: {
            en: ['B.Sc. in Computer Science'],
            ar: ['بكالوريوس في علوم الحاسب']
        },
        certifications: {
            en: ['Certified Analytics Professional (CAP)'],
            ar: ['محترف تحليلات معتمد (CAP)']
        },
        trainingCourses: {
            en: ['Data Visualization with Tableau', 'Advanced SQL'],
            ar: ['تصور البيانات باستخدام Tableau', 'SQL متقدم']
        },
        tasks: {
            en: ['Analyze operational data', 'Create performance dashboards', 'Identify improvement opportunities'],
            ar: ['تحليل البيانات التشغيلية', 'إنشاء لوحات معلومات الأداء', 'تحديد فرص التحسين']
        },
        achievements: {
            en: ['Developed a predictive model for financial forecasting', 'Automated weekly reporting process'],
            ar: ['طورت نموذجًا تنبئيًا للتنبؤ المالي', 'أتمتة عملية إعداد التقارير الأسبوعية']
        }
    },
];

export const seedProcedures: Procedure[] = [
    {
        id: 'proc1',
        code: 'PROC-001',
        title: { en: 'New Land Regulation Request', ar: 'طلب تنظيم أرض جديد' },
        description: { 
            en: 'This procedure outlines the steps for successfully processing a new land regulation request, from submission to final decision.', 
            ar: 'يحدد هذا الإجراء خطوات معالجة طلب تنظيم أرض جديد بنجاح، من التقديم إلى القرار النهائي.'
        },
        inputs: {
            en: '1. Submitted Request Form\n2. Land Ownership Documents',
            ar: '١. نموذج الطلب المُقدَّم\n٢. وثائق ملكية الأرض'
        },
        outputs: {
            en: '1. Official Decision Document',
            ar: '١. وثيقة القرار الرسمي'
        },
        departmentId: '4', // Land Regulation and Protection Department
        eReadiness: 'partially-electronic',
        createdAt: '2023-01-15T10:00:00.000Z',
        updatedAt: '2023-01-15T10:00:00.000Z',
        kpis: [],
        linkedTaskIds: [],
        linkedTargetIds: [],
    },
];