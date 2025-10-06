import { Challenge, Opportunity, Department, Activity, LeadTasksData, Employee, Procedure } from '../types';

export const departments: Department[] = [
    { id: '1', name: { en: 'Land Allocation Operations', ar: 'إدارة عمليات تخصيص الأراضي' } },
    { id: '2', name: { en: 'Land Approvals Department', ar: 'إدارة موافقات الأراضي' } },
    { id: '3', name: { en: 'Land Objections Department', ar: 'إدارة اعتراضات الأراضي' } },
    { id: '4', name: { en: 'Geospatial Data Department', ar: 'إدارة البيانات الجيومكانية' } },
    { id: '5', name: { en: 'Land Affairs Department', ar: 'إدارة شؤون الأراضي' } },
    { id: '6', name: { en: 'Land Protection Department', ar: 'إدارة حماية وتنظيم الأراضي' } },
];

const now = new Date().toISOString();

// This data is used ONLY to seed the database on the first run.
// It is not a live data source for the application components.
export const seedChallenges: Challenge[] = [
    {
        type: 'challenge',
        id: 'c1',
        code: 'CH01',
        title_ar: 'تأخير في معالجة طلبات تخصيص الأراضي',
        title_en: 'Delays in processing land allocation requests',
        description: 'تأخير في معالجة طلبات تخصيص الأراضي بسبب التحقق اليدوي الذي يستغرق وقتا طويلا ويؤثر على كفاءة الإدارة.',
        status: 'قيد المعالجة',
        priority: 'عالي',
        category: 'تشغيلي',
        impact: 'مرتفع',
        effort: 'مرتفع',
        priority_category: 'major_projects',
        priority_score: 3,
        progress_notes: 'تم تحليل الوضع الحالي وتحديد نقاط الضعف الرئيسية في العملية الورقية.',
        remediation_plan: 'تطوير ونشر بوابة رقمية جديدة في غضون 6 أشهر لتقديم الطلبات ومتابعتها.',
        requirements_enablers: 'موافقة الميزانية، توفر فريق تقنية المعلومات، تدريب الموظفين.',
        activities: [
            { description: 'جمع المتطلبات من الإدارات المعنية', weight: 5, is_completed: false },
            { description: 'اختيار المورد التقني المناسب', weight: 4, is_completed: false },
            { description: 'تصميم واجهة المستخدم وتجربة المستخدم', weight: 3, is_completed: false },
        ],
        department: 'إدارة عمليات تخصيص الأراضي',
        start_date: '2024-01-15',
        target_date: '2024-07-15',
        created_at: now,
        updated_at: now,
        is_archived: false,
    },
    {
        type: 'challenge',
        id: 'c2',
        code: 'CH02',
        title_ar: 'تطبيق غير متسق لمعايير الموافقة',
        title_en: 'Inconsistent application of approval criteria',
        description: 'تطبيق غير متسق لمعايير الموافقة على الأراضي عبر المناطق المختلفة مما يؤدي إلى شكاوى.',
        status: 'مغلق',
        priority: 'عالي',
        category: 'حوكمة',
        impact: 'مرتفع',
        effort: 'منخفض',
        priority_category: 'quick_wins',
        priority_score: 4,
        progress_notes: 'تم عقد ورش عمل وإصدار دليل موحد للمعايير.',
        remediation_plan: 'عقد ورش عمل وتدريب للموظفين وإصدار دليل موحد للمعايير.',
        requirements_enablers: 'موافقة الإدارة العليا، توفير مرافق تدريب.',
        activities: [
            { description: 'صياغة الدليل الموحد', weight: 5, is_completed: true },
            { description: 'تخطيط وتنفيذ جلسات التدريب', weight: 5, is_completed: true },
        ],
        department: 'إدارة موافقات الأراضي',
        start_date: '2023-11-01',
        target_date: '2024-02-01',
        created_at: now,
        updated_at: now,
        is_archived: false,
    },
     {
        type: 'challenge',
        id: 'c3',
        code: 'CH03',
        title_ar: 'عدم وجود رؤية فورية لحالة قطع الأراضي',
        title_en: 'Lack of real-time visibility into land parcel status',
        description: 'صعوبة في تتبع الحالة الحالية لقطع الأراضي المخصصة بسبب عدم وجود نظام مركزي محدث.',
        status: 'جديد',
        priority: 'متوسط',
        category: 'تقني',
        impact: 'متوسط',
        effort: 'متوسط',
        priority_category: 'small_quick_wins',
        priority_score: 2,
        progress_notes: 'لم يتم البدء بعد.',
        remediation_plan: 'تطوير واجهة برمجة تطبيقات (API) للتكامل مع نظام البيانات الجيومكانية.',
        requirements_enablers: 'تعاون كامل من إدارة البيانات الجيومكانية.',
        activities: [
            { description: 'تحديد مواصفات الواجهة البرمجية (API)', weight: 4, is_completed: false },
            { description: 'تطوير واختبار التكامل', weight: 5, is_completed: false },
        ],
        department: 'إدارة عمليات تخصيص الأراضي',
        start_date: '2024-05-01',
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
        title: 'Streamline Land Approval Process',
        department: 'إدارة موافقات الأراضي',
        status: 'Under Review',
        impact: 'مرتفع',
        effort: 'متوسط',
        priority: 'عالي',
        priority_category: 'major_projects',
        priority_score: 3,
        currentSituation: 'The process takes an average of 60 days, with multiple manual handoffs.',
        proposedSolution: 'Implement a digital portal for submissions to automate workflows and reduce paperwork.',
        progress: 10,
        owner: 'Ahmed Al-Fahad',
        startDate: '2024-08-01',
        dueDate: '2025-02-01',
        createdAt: now,
        updatedAt: now,
    },
    {
        type: 'opportunity',
        id: 'op2',
        code: 'OP02',
        title: 'Automate Geospatial Data Updates',
        department: 'إدارة البيانات الجيومكانية',
        status: 'In Progress',
        impact: 'مرتفع',
        effort: 'مرتفع',
        priority: 'عالي',
        priority_category: 'major_projects',
        priority_score: 3,
        currentSituation: 'Manual data entry from satellite imagery is slow and prone to errors.',
        proposedSolution: 'Use AI to detect changes in satellite imagery and automatically update the database.',
        progress: 45,
        owner: 'Layla Nasser',
        startDate: '2024-06-15',
        dueDate: '2024-12-15',
        createdAt: now,
        updatedAt: now,
    },
    {
        type: 'opportunity',
        id: 'op3',
        code: 'OP03',
        title: 'Enhance Land Protection Patrols',
        department: 'إدارة حماية وتنظيم الأراضي',
        status: 'Implemented',
        impact: 'متوسط',
        effort: 'متوسط',
        priority: 'متوسط',
        priority_category: 'small_quick_wins',
        priority_score: 2,
        currentSituation: 'Patrol routes are static and predictable, leading to inefficient coverage.',
        proposedSolution: 'Use predictive analytics based on historical data to generate dynamic patrol routes.',
        progress: 100,
        owner: 'Sultan Al-Harbi',
        startDate: '2023-10-01',
        dueDate: '2024-04-01',
        createdAt: now,
        updatedAt: now,
    }
];

export const seedLeadTasksData: LeadTasksData = {
  leaderName: 'اسم القائد',
  leaderPhoto: 'https://picsum.photos/id/305/200/200',
  tasks: {
    strategic: [
      { id: 's1', text: 'مهمة استراتيجية 1' },
      { id: 's2', text: 'مهمة استراتيجية 2' },
    ],
    communication: [
      { id: 'c1', text: 'تواصل مستمر' },
      { id: 'c2', text: 'مهمة اتصال وتنسيق أخرى' },
    ],
    development: [
      { id: 'd1', text: 'مقترحات تحسين' },
      { id: 'd2', text: 'مهمة تطوير وتحسين أخرى' },
    ],
    operational: [
      { id: 'o1', text: 'اجتماع أسبوعي' },
      { id: 'o2', text: 'مراقبة مؤشرات' },
    ],
    additional: [
      { id: 'a1', text: 'موافقات قانونية' },
    ],
  },
};

export const seedEmployees: Employee[] = [
    {
        id: 'emp1',
        name: { en: 'Abdullah Al-Qahtani', ar: 'عبدالله القحطاني' },
        title: { en: 'Activation Lead', ar: 'قائد التفعيل' },
        department: { en: 'Land Allocation Operations', ar: 'إدارة عمليات تخصيص الأراضي' },
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
        name: { en: 'Fatima Al-Zahrani', ar: 'فاطمة الزهراني' },
        title: { en: 'Data Analyst', ar: 'محلل بيانات' },
        department: { en: 'Geospatial Data Department', ar: 'إدارة البيانات الجيومكانية' },
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
            en: ['Developed a predictive model for land demand', 'Automated weekly reporting process'],
            ar: ['طورت نموذجًا تنبئيًا للطلب على الأراضي', 'أتمتة عملية إعداد التقارير الأسبوعية']
        }
    },
    {
        id: 'emp3',
        name: { en: 'Mohammed Al-Ghamdi', ar: 'محمد الغامدي' },
        title: { en: 'Process Improvement Specialist', ar: 'أخصائي تحسين العمليات' },
        department: { en: 'Land Approvals Department', ar: 'إدارة موافقات الأراضي' },
        avatar: '', // Test placeholder
        joinDate: '2021-09-01',
        experienceYears: 6,
        qualifications: {
            en: ['M.Sc. in Industrial Engineering'],
            ar: ['ماجستير في الهندسة الصناعية']
        },
        certifications: {
            en: ['Lean Six Sigma Green Belt'],
            ar: ['الحزام الأخضر في Lean Six Sigma']
        },
        trainingCourses: {
            en: ['Business Process Modeling', 'Root Cause Analysis'],
            ar: ['نمذجة عمليات الأعمال', 'تحليل السبب الجذري']
        },
        tasks: {
            en: ['Map current state processes', 'Identify bottlenecks and inefficiencies', 'Propose and implement solutions'],
            ar: ['رسم خرائط العمليات الحالية', 'تحديد الاختناقات وأوجه القصور', 'اقتراح وتنفيذ الحلول']
        },
        achievements: {
            en: ['Reduced land approval time by 15 days', 'Standardized documentation across three departments'],
            ar: ['قلل وقت الموافقة على الأراضي بمقدار 15 يومًا', 'وحّد الوثائق عبر ثلاث إدارات']
        }
    }
];

export const seedProcedures: Procedure[] = [
    {
        id: 'proc1',
        code: 'PROC-001',
        title: { en: 'Land Allocation Request', ar: 'طلب تخصيص أرض' },
        description: { 
            en: 'This procedure outlines the steps for submitting, reviewing, and approving requests for industrial land allocation. It covers the entire lifecycle from initial application to final contract signing.', 
            ar: 'يحدد هذا الإجراء خطوات تقديم ومراجعة واعتماد طلبات تخصيص الأراضي الصناعية. ويغطي دورة الحياة الكاملة من الطلب الأولي إلى توقيع العقد النهائي.'
        },
        inputs: {
            en: '1. Application Form\n2. Commercial Registration Certificate',
            ar: '١. نموذج الطلب\n٢. شهادة السجل التجاري'
        },
        outputs: {
            en: '1. Approved Allocation Contract',
            ar: '١. عقد تخصيص معتمد'
        },
        policiesAndReferences: {
            en: 'Industrial Development Law, Article 5\nInternal Policy No. 102.A',
            ar: 'نظام التنمية الصناعية، المادة 5\nالسياسة الداخلية رقم 102.أ'
        },
        technicalSystems: {
            en: 'Online Portal for Industrialists\nCRM System',
            ar: 'بوابة الصناعيين الإلكترونية\nنظام إدارة علاقات العملاء'
        },
        departmentId: '1',
        linkedService: { en: 'Industrial Land Allocation', ar: 'تخصيص الأراضي الصناعية' },
        durationDays: 45,
        eReadiness: 'electronic',
        formsUsed: [{
            name: { en: 'Application Form A1', ar: 'نموذج التقديم أ1' },
            file: { name: 'form-a1.pdf', type: 'application/pdf', content: '' }
        }],
        definitions: [
            {
                id: 'def1',
                term: { en: 'Industrialist', ar: 'الصناعي' },
                definition: { en: 'Any entity practicing industrial activity licensed by the ministry.', ar: 'أي كيان يمارس نشاطًا صناعيًا مرخصًا من قبل الوزارة.' }
            }
        ],
        kpi: {
            name: { en: 'Processing Time', ar: 'زمن المعالجة' },
            target: { en: 'Less than 45 days', ar: 'أقل من 45 يومًا' },
            description: { en: 'Average time from application submission to final decision.', ar: 'متوسط الوقت من تقديم الطلب إلى القرار النهائي.' }
        },
        createdAt: '2023-01-15T10:00:00.000Z',
        updatedAt: '2023-01-15T10:00:00.000Z',
    },
    {
        id: 'proc2',
        code: 'PROC-002',
        title: { en: 'Objection to an Allocation Decision', ar: 'الاعتراض على قرار تخصيص' },
        description: { 
            en: 'Procedure for submitting and reviewing objections to land allocation decisions. This includes formal review by the committee and issuing a final response.',
            ar: 'إجراء لتقديم ومراجعة الاعتراضات على قرارات تخصيص الأراضي. يتضمن ذلك المراجعة الرسمية من قبل اللجنة وإصدار رد نهائي.'
        },
        inputs: {
            en: '1. Objection Form\n2. Supporting Documents',
            ar: '١. نموذج الاعتراض\n٢. المستندات الداعمة'
        },
        outputs: {
            en: '1. Final Decision on Objection',
            ar: '١. القرار النهائي بشأن الاعتراض'
        },
        policiesAndReferences: {
            en: 'Grievance Policy Document',
            ar: 'وثيقة سياسة التظلمات'
        },
        technicalSystems: {
            en: 'Internal Case Management System',
            ar: 'نظام إدارة الحالات الداخلي'
        },
        departmentId: '3',
        linkedService: { en: 'Objection and Grievance Services', ar: 'خدمات الاعتراضات والتظلمات' },
        durationDays: 30,
        eReadiness: 'partially-electronic',
        createdAt: '2023-02-20T14:30:00.000Z',
        updatedAt: '2023-02-20T14:30:00.000Z',
    },
    {
        id: 'proc3',
        code: 'PROC-003',
        title: { en: 'Geospatial Data Update Request', ar: 'طلب تحديث بيانات جيومكانية' },
        description: { 
            en: 'Manual process for requesting updates to geospatial data maps. Requires submitting paper forms and manual verification by the data team.',
            ar: 'عملية يدوية لطلب تحديثات على خرائط البيانات الجيومكانية. تتطلب تقديم نماذج ورقية والتحقق اليدوي من قبل فريق البيانات.'
        },
        inputs: {
            en: '1. Paper-based Update Form\n2. Coordinate Sheet',
            ar: '١. نموذج تحديث ورقي\n٢. ورقة الإحداثيات'
        },
        outputs: {
            en: '1. Confirmation of Update (by phone)',
            ar: '١. تأكيد التحديث (عبر الهاتف)'
        },
        policiesAndReferences: {
            en: 'Geospatial Data Standards Manual',
            ar: 'دليل معايير البيانات الجيومكانية'
        },
        technicalSystems: {
            en: 'N/A (Manual Process)',
            ar: 'لا يوجد (عملية يدوية)'
        },
        departmentId: '4',
        linkedService: { en: 'Geospatial Data Services', ar: 'خدمات البيانات الجيومكانية' },
        durationDays: 15,
        eReadiness: 'not-electronic',
        createdAt: '2023-03-10T09:00:00.000Z',
        updatedAt: '2023-03-10T09:00:00.000Z',
    }
];