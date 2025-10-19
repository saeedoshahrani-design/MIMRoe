import React, { useState, useMemo, useRef, useEffect } from 'react';
import PageTitle from '../components/PageTitle.tsx';
import Card from '../components/Card.tsx';
import { useLocalization } from '../hooks/useLocalization.ts';
import { SparklesIcon, DocumentArrowDownIcon, ChevronDownIcon } from '../components/icons/IconComponents.tsx';
import { GoogleGenAI } from '@google/genai';
import { useChallenges } from '../context/ChallengesContext.tsx';
import { useOpportunities } from '../context/OpportunitiesContext.tsx';
import { useEmployeeContext } from '../context/EmployeeContext.tsx';
import { useProcedures } from '../context/ProceduresContext.tsx';
import { Procedure, TimelineTask } from '../types.ts';
import { db } from '../firebase.ts';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext.tsx';
import { useInitiatives } from '../context/InitiativesContext.tsx';
import { useTimelineTasks } from '../context/TimelineTasksContext.tsx';
import { calculateProgress } from '../utils/calculateProgress.ts';
import { calculatePlannedProgress } from '../utils/calculatePlannedProgress.ts';

// Helper to use an outside click to close dropdowns
const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) return;
            handler();
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

// Simple Markdown to HTML for printing
const markdownToHtml = (md: string): string => {
    if (!md) return '';

    const lines = md.split('\n');
    let html = '';
    let inTable = false;
    let inList = false;

    // Helper for inline formatting (bold, italic)
    const formatInline = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    };

    lines.forEach(line => {
        const trimmedLine = line.trim();

        // Close list if the line is not a list item
        if (inList && !trimmedLine.startsWith('* ')) {
            html += '</ul>\n';
            inList = false;
        }

        if (trimmedLine.startsWith('# ')) {
            html += `<h1 style="font-size: 2em; margin-bottom: 0.5em; border-bottom: 2px solid #eee; padding-bottom: 0.3em;">${formatInline(trimmedLine.substring(2))}</h1>\n`;
        } else if (trimmedLine.startsWith('## ')) {
            html += `<h2 style="font-size: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em;">${formatInline(trimmedLine.substring(3))}</h2>\n`;
        } else if (trimmedLine.startsWith('### ')) {
            html += `<h3 style="font-size: 1.2em; margin-bottom: 0.5em;">${formatInline(trimmedLine.substring(4))}</h3>\n`;
        } else if (trimmedLine.startsWith('* ')) {
            if (!inList) {
                html += '<ul>\n';
                inList = true;
            }
            html += `<li>${formatInline(trimmedLine.substring(2))}</li>\n`;
        } else if (trimmedLine.startsWith('|')) {
            const cells = trimmedLine.split('|').slice(1, -1);
            if (!inTable) {
                html += '<table style="width: 100%; border-collapse: collapse; margin-top: 1em; margin-bottom: 1em;">\n';
                inTable = true;
                // This is the header row
                html += '<thead>\n<tr>\n';
                cells.forEach(cell => {
                    html += `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: right;">${formatInline(cell.trim())}</th>\n`;
                });
                html += '</tr>\n</thead>\n<tbody>\n';
            } else if (cells.every(cell => cell.trim().match(/^--+$/))) {
                // This is the separator line, we already handled the header, so we just ignore it.
            } else {
                // This is a body row
                html += '<tr>\n';
                cells.forEach(cell => {
                    html += `<td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatInline(cell.trim())}</td>\n`;
                });
                html += '</tr>\n';
            }
        } else {
            // End of table
            if (inTable) {
                html += '</tbody>\n</table>\n';
                inTable = false;
            }
            // Regular paragraph text
            if (trimmedLine) {
                html += `<p>${formatInline(trimmedLine)}</p>\n`;
            }
        }
    });

    // Close any open tags at the end of the document
    if (inTable) html += '</tbody>\n</table>\n';
    if (inList) html += '</ul>\n';

    return html;
};


// Helper to calculate tenure in months
const calculateTenureInMonths = (joinDateString?: string | null): number => {
    if (!joinDateString) return 0;
    try {
        const joinDate = new Date(joinDateString);
        const now = new Date();
        
        if (joinDate > now) return 0;

        const yearDiff = now.getFullYear() - joinDate.getFullYear();
        const monthDiff = now.getMonth() - joinDate.getMonth();
        
        let totalMonths = yearDiff * 12 + monthDiff;
        
        if (now.getDate() < joinDate.getDate()) {
            totalMonths--;
        }

        return Math.max(0, totalMonths);
    } catch(e) {
        console.error("Error calculating tenure:", e);
        return 0;
    }
};

interface SavedReport {
    id: string;
    type: string;
    date: string;
    content: string;
    name: string;
}

const Reports: React.FC = () => {
    const { t, language, formatDate } = useLocalization();
    const { user } = useAuth();

    // Data from contexts
    const { challenges } = useChallenges();
    const { opportunities } = useOpportunities();
    const { employees } = useEmployeeContext();
    const { procedures } = useProcedures();
    const { initiatives } = useInitiatives();
    const { manualTasks } = useTimelineTasks();
    
    // UI State
    const [reportType, setReportType] = useState('summary');
    const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
    const [selectedInitiatives, setSelectedInitiatives] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReportText, setGeneratedReportText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
    const [isProcedureDropdownOpen, setIsProcedureDropdownOpen] = useState(false);
    const [isInitiativeDropdownOpen, setIsInitiativeDropdownOpen] = useState(false);
    const procedureDropdownRef = useRef<HTMLDivElement>(null);
    const initiativeDropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(procedureDropdownRef, () => setIsProcedureDropdownOpen(false));
    useClickOutside(initiativeDropdownRef, () => setIsInitiativeDropdownOpen(false));

    // Fetch saved reports from Firestore
    useEffect(() => {
        if (!user) {
            setSavedReports([]);
            return;
        }

        const reportsCollectionRef = collection(db, 'workspaces', 'shared', 'reports');
        const q = query(reportsCollectionRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const reportsFromDb = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as SavedReport));
            setSavedReports(reportsFromDb);
        }, (error) => {
            console.error("Error fetching reports:", error);
        });

        return () => unsubscribe();
    }, [user]);


    // Hardcoded labels to respect the "only change this file" constraint
    const labels = useMemo(() => language === 'ar' ? {
        generateReport: 'إنشاء تقرير',
        reportType: 'نوع التقرير',
        reportTypes: {
            summary: 'تقرير الملخص التنفيذي للتفعيل',
            skills: 'تقرير الفجوات في المهارات وتوزيع عبء العمل',
            procedure: 'تقرير حول إجراء',
            employee: 'تقرير الموظفين',
            businessTimeline: 'تقرير الجدول الزمني للأعمال',
            initiatives: 'تقرير حول المبادرات',
        },
        selectProcedures: 'اختر الإجراءات',
        selectInitiatives: 'اختر المبادرات',
        selectDateRange: 'تحديد فترة زمنية لسجل التعديلات',
        from: 'من',
        to: 'إلى',
        generating: 'جاري الإنشاء...',
        previewAndEdit: 'مراجعة وتعديل التقرير',
        approveAndSave: 'موافقة وحفظ كـ PDF',
        reportLog: 'سجل التقارير',
        log: { number: '#', type: 'نوع التقرير', date: 'تاريخ التقرير', attachment: 'مرفق التقرير' },
        viewDownload: 'عرض/تحميل',
        noReports: 'لا توجد تقارير محفوظة بعد.'
    } : {
        generateReport: 'Generate Report',
        reportType: 'Report Type',
        reportTypes: {
            summary: 'Executive Activation Summary Report',
            skills: 'Skills Gap & Workload Distribution Report',
            procedure: 'Procedure Report',
            employee: 'Employee Report',
            businessTimeline: 'Business Timeline Report',
            initiatives: 'Initiatives Report',
        },
        selectProcedures: 'Select Procedures',
        selectInitiatives: 'Select Initiatives',
        selectDateRange: 'Select Date Range for Change Log',
        from: 'From',
        to: 'To',
        generating: 'Generating...',
        previewAndEdit: 'Review and Edit Report',
        approveAndSave: 'Approve & Save as PDF',
        reportLog: 'Report Log',
        log: { number: '#', type: 'Report Type', date: 'Report Date', attachment: 'Attachment' },
        viewDownload: 'View/Download',
        noReports: 'No saved reports yet.'
    }, [language]);

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        setGeneratedReportText('');
        setError(null);

        try {
            // FIX: Moved dynamic import to top-level. Using `process.env.API_KEY!` assuming it's set as per guidelines.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            let dataContext = {};
            let promptInstructions = '';

            switch (reportType) {
                case 'summary':
                    promptInstructions = 'Generate an executive summary about the activation status. Analyze challenges, opportunities, team size, initiatives, and procedures. Provide insights, trends, early warnings, SMART recommendations, and a confidence level.';
                    dataContext = { challenges, opportunities, employees, initiatives, procedures };
                    break;
                case 'skills':
                    promptInstructions = 'Analyze the provided employee roles/tasks and procedure steps to identify skill gaps and workload imbalances. Provide a textual map of gaps, probable causes, recommendations for redistribution or training, and operational risk indicators with a confidence level.';
                    dataContext = { employees, procedures };
                    break;
                case 'procedure':
                    if (selectedProcedures.length === 0) {
                        setError(language === 'ar' ? 'الرجاء اختيار إجراء واحد على الأقل.' : 'Please select at least one procedure.');
                        setIsGenerating(false);
                        return;
                    }
                    promptInstructions = 'Analyze the selected procedures. For each, analyze KPI trends, highlight significant changes from the change log (within the specified date range), summarize the impact of modifications on performance, and provide focused improvement suggestions with justification and priority.';
                    const relevantProcedures = procedures
                        .filter(p => selectedProcedures.includes(p.id))
                        .map(p => ({
                            ...p,
                            changeLog: (p.changeLog || []).filter(log => {
                                if (!dateRange.start || !dateRange.end) return true;
                                const logDate = new Date(log.timestamp);
                                return logDate >= new Date(dateRange.start) && logDate <= new Date(dateRange.end);
                            })
                        }));
                    dataContext = { procedures: relevantProcedures, dateRange };
                    break;
                case 'employee':
                    promptInstructions = "Analyze the employee data. Provide total employee count and the sum of all employees' tenure in months (tenureInMonths). For each employee, list strengths and weaknesses based on their qualifications, tasks and achievements. Aggregate patterns like bottlenecks or task overlaps. Provide individual and group development recommendations, a confidence level for each conclusion, and a brief justification.";
                    
                    const employeesWithTenure = employees.map(emp => ({
                        ...emp,
                        tenureInMonths: calculateTenureInMonths(emp.joinDate)
                    }));
            
                    dataContext = { employees: employeesWithTenure };
                    break;
                case 'businessTimeline':
                    promptInstructions = "قم بإعداد تقرير حول الجدول الزمني للأعمال. يجب أن يتضمن التقرير تحليلاً للبيانات ثم جدول Markdown واحد وكامل. لا تقم بتقسيم الجدول أو إضافة أي نصوص بعده.\n\nالجدول يجب أن يحتوي على الأعمدة التالية بالترتيب المحدد:\n'اسم المهمة', 'الوصف', 'الحالة', 'تاريخ البدء', 'تاريخ الانتهاء المستهدف', 'نسبة الإنجاز الفعلية٪', 'نسبة الإنجاز المخطط لها٪'.\n\nمثال على شكل الجدول:\n| اسم المهمة | الوصف | الحالة | ... |\n|---|---|---|---|\n| ... | ... | ... | ... |\n\nالبيانات المطلوبة موجودة في مصفوفة JSON باسم 'allTasks'. قم بتحليل هذه البيانات وعرضها بشكل منظم في الجدول.";
                    
                    const linkedTasks: TimelineTask[] = challenges.map(c => ({
                        id: c.id,
                        seq: 0, // not important for report
                        title: c.title,
                        code: c.code,
                        department: c.department,
                        start: c.start_date,
                        end: c.target_date,
                        actual_percent: calculateProgress(c.activities),
                        planned_percent_today: calculatePlannedProgress(c.start_date, c.target_date),
                        status: c.status,
                        source: 'linked',
                        description: c.description
                    }));

                    const manualTasksWithPlannedProgress = manualTasks.map(task => ({
                        ...task,
                        planned_percent_today: calculatePlannedProgress(
                            task.start instanceof Date ? task.start.toISOString() : task.start,
                            task.end instanceof Date ? task.end.toISOString() : task.end
                        )
                    }));

                    const allTasks = [...linkedTasks, ...manualTasksWithPlannedProgress].sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                    dataContext = { allTasks };
                    break;
                case 'initiatives':
                    if (selectedInitiatives.length === 0) {
                        setError(language === 'ar' ? 'الرجاء اختيار مبادرة واحدة على الأقل.' : 'Please select at least one initiative.');
                        setIsGenerating(false);
                        return;
                    }
                    promptInstructions = `قم بإعداد تقرير شامل حول المبادرة/المبادرات المحددة. قدم نظرة عامة وتحليلاً للوضع الكلي مع نقاط تحسين. بعد التحليل، قم بإنشاء جدول Markdown واحد وكامل لجميع المهام. لا تقم بتقسيم الجدول أو إضافة أي تعليقات بين صفوفه أو بعده.\n\nالجدول يجب أن يحتوي على الأعمدة الثمانية التالية بالضبط وبالترتيب المحدد:\n1. 'اسم المهمة' (من حقل 'title')\n2. 'الوصف' (من حقل 'description')\n3. 'المسؤول' (من حقل 'assignee')\n4. 'الحالة' (من حقل 'status')\n5. 'تاريخ البدء' (من حقل 'start')\n6. 'التاريخ المستهدف' (من حقل 'end')\n7. 'نسبة الإنجاز الفعلية ٪' (من حقل 'actual_percent')\n8. 'نسبة الإنجاز المخطط لها ٪' (من حقل 'planned_percent_today')\n\nتأكد من أن الجدول كتلة واحدة متصلة.`;
                    
                    const relevantInitiatives = initiatives
                        .filter(i => selectedInitiatives.includes(i.id))
                        .map(initiative => ({
                            ...initiative,
                            tasks: (initiative.tasks || []).map(task => ({
                                ...task,
                                planned_percent_today: calculatePlannedProgress(task.start, task.end)
                            }))
                        }));
                    
                    dataContext = { initiatives: relevantInitiatives };
                    break;
            }

            const fullPrompt = `أنت محلل تميز تشغيلي خبير. مهمتك هي إنشاء تقرير مفصل باللغة العربية بناءً على البيانات المقدمة فقط. اتبع هذه القواعد بصرامة:
1.  حلل البيانات المقدمة في قسم "سياق البيانات". لا تستخدم أي معرفة خارجية أو تفترض معلومات غير موجودة.
2.  قم بهيكلة ردك باللغة العربية الواضحة والمهنية باستخدام تنسيق Markdown.
3.  ضمّن "ملخص تنفيذي" يحتوي على الرؤى الرئيسية.
4.  ضمّن قسم "التوصيات" بأهداف SMART قابلة للتنفيذ.
5.  لكل رؤية أو توصية رئيسية، قدم "مستوى الثقة" (مرتفع, متوسط, منخفض) و "لماذا؟" موجز يشرح نقاط البيانات التي أدت إلى هذا الاستنتاج.
6.  إذا كانت البيانات ناقصة أو غير كافية لتحليل كامل، اذكر ذلك صراحة في قسم "ملاحظات حول جودة البيانات" واشرح تأثير ذلك على مستوى الثقة.
7.  يجب أن يكون الناتج النهائي باللغة العربية.

[تعليمات لهذا النوع من التقارير]
${promptInstructions}

[سياق البيانات]
\`\`\`json
${JSON.stringify(dataContext)}
\`\`\`
`;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: fullPrompt });
            setGeneratedReportText(response.text);

        } catch (e: any) {
            console.error("Report Generation Error:", e);
            setError(e.message || (language === 'ar' ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.'));
        } finally {
            setIsGenerating(false);
        }
    };

    const printReport = (content: string, reportName: string) => {
        const htmlContent = markdownToHtml(content);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${reportName}</title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap');
                            body { font-family: 'Almarai', sans-serif; direction: rtl; margin: 2cm; }
                            h1, h2, h3 { color: #581c87; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 20px; }
                            h1 { font-size: 2em; }
                            h2 { font-size: 1.5em; }
                            h3 { font-size: 1.2em; }
                            strong { color: #1f2937; }
                            ul { padding-right: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 1em; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                            th { background-color: #f2f2f2; }
                            tbody tr:nth-child(even) { background-color: #f9f9f9; }
                            p { line-height: 1.6; }
                            @page { size: A4; margin: 2cm; }
                            @media print {
                                body { -webkit-print-color-adjust: exact; }
                                button { display: none; }
                            }
                        </style>
                    </head>
                    <body>${htmlContent}</body>
                </html>`);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    const handleApproveAndSave = async () => {
        if (!user) {
            setError("You must be logged in to save reports.");
            return;
        }
        const date = new Date();
        const reportName = `${labels.reportTypes[reportType as keyof typeof labels.reportTypes]}`;
        const newReport = {
            type: reportType,
            date: date.toISOString(),
            content: generatedReportText,
            name: reportName,
            userId: user.uid, // Good practice to associate data with user
        };
        try {
            const reportsCollectionRef = collection(db, 'workspaces', 'shared', 'reports');
            await addDoc(reportsCollectionRef, newReport);
            printReport(generatedReportText, reportName);
            setGeneratedReportText('');
        } catch (error) {
            console.error("Error saving report to Firestore:", error);
            setError("Failed to save report.");
        }
    };

    return (
        <div className="space-y-6">
            <PageTitle />

            {/* Report Generator */}
            <Card>
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">{labels.generateReport}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{labels.reportType}</label>
                            <select 
                                value={reportType} 
                                onChange={e => {
                                    setReportType(e.target.value);
                                    setSelectedProcedures([]);
                                    setSelectedInitiatives([]);
                                }} 
                                className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600"
                            >
                                {Object.entries(labels.reportTypes).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {reportType === 'procedure' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t dark:border-natural-700">
                            <div ref={procedureDropdownRef}>
                                <label className="block text-sm font-medium mb-1">{labels.selectProcedures}</label>
                                <button onClick={() => setIsProcedureDropdownOpen(prev => !prev)} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600 flex justify-between items-center text-left">
                                    <span className="truncate">{selectedProcedures.length > 0 ? `${selectedProcedures.length} selected` : 'Select...'}</span>
                                    <ChevronDownIcon className="w-5 h-5" />
                                </button>
                                {isProcedureDropdownOpen && (
                                    <div className="absolute z-10 mt-1 w-72 bg-white dark:bg-natural-800 shadow-lg border rounded-md max-h-60 overflow-y-auto">
                                        {procedures.map(p => (
                                            <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-natural-100 dark:hover:bg-natural-700 cursor-pointer">
                                                <input type="checkbox" checked={selectedProcedures.includes(p.id)} onChange={() => setSelectedProcedures(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])} />
                                                <span>{p.title[language]}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{labels.selectDateRange}</label>
                                <div className="flex gap-2">
                                    <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600" aria-label={labels.from} />
                                    <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600" aria-label={labels.to} />
                                </div>
                            </div>
                        </div>
                    )}

                    {reportType === 'initiatives' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t dark:border-natural-700">
                            <div ref={initiativeDropdownRef}>
                                <label className="block text-sm font-medium mb-1">{labels.selectInitiatives}</label>
                                <button onClick={() => setIsInitiativeDropdownOpen(prev => !prev)} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600 flex justify-between items-center text-left">
                                    <span className="truncate">{selectedInitiatives.length > 0 ? `${selectedInitiatives.length} selected` : 'Select...'}</span>
                                    <ChevronDownIcon className="w-5 h-5" />
                                </button>
                                {isInitiativeDropdownOpen && (
                                    <div className="absolute z-10 mt-1 w-72 bg-white dark:bg-natural-800 shadow-lg border rounded-md max-h-60 overflow-y-auto">
                                        {initiatives.map(i => (
                                            <label key={i.id} className="flex items-center gap-2 p-2 hover:bg-natural-100 dark:hover:bg-natural-700 cursor-pointer">
                                                <input type="checkbox" checked={selectedInitiatives.includes(i.id)} onChange={() => setSelectedInitiatives(prev => prev.includes(i.id) ? prev.filter(id => id !== i.id) : [...prev, i.id])} />
                                                <span>{i.name[language]}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="text-right">
                        <button onClick={handleGenerateReport} disabled={isGenerating} className="flex items-center gap-2 px-4 py-2 bg-dark-purple-600 text-white rounded-md text-sm font-medium hover:bg-dark-purple-700 disabled:bg-natural-400">
                            {isGenerating ? (
                                <>
                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                 {labels.generating}
                                </>
                            ) : (
                                <>
                                <SparklesIcon className="w-5 h-5" />
                                {labels.generateReport}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Card>

            {/* Report Preview */}
            {generatedReportText && (
                <Card>
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">{labels.previewAndEdit}</h2>
                        <textarea value={generatedReportText} onChange={e => setGeneratedReportText(e.target.value)} rows={20} className="w-full p-2 bg-natural-100 dark:bg-natural-700 rounded-md border border-natural-300 dark:border-natural-600 font-mono text-sm leading-relaxed"></textarea>
                        <div className="text-right">
                            <button onClick={handleApproveAndSave} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
                                <DocumentArrowDownIcon className="w-5 h-5" />
                                {labels.approveAndSave}
                            </button>
                        </div>
                    </div>
                </Card>
            )}
            
            {/* Report Log */}
            <Card>
                <h2 className="text-xl font-bold mb-4">{labels.reportLog}</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-natural-600 dark:text-natural-400 uppercase bg-natural-100 dark:bg-natural-700">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-center">{labels.log.number}</th>
                                <th className="px-4 py-3 font-semibold text-left rtl:text-right">{labels.log.type}</th>
                                <th className="px-4 py-3 font-semibold text-left rtl:text-right">{labels.log.date}</th>
                                <th className="px-4 py-3 font-semibold text-left rtl:text-right">{labels.log.attachment}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-natural-200 dark:divide-natural-700">
                            {savedReports.length > 0 ? savedReports.map((report, index) => (
                                <tr key={report.id} className="hover:bg-natural-50 dark:hover:bg-natural-800/50">
                                    <td className="px-4 py-3 text-center text-natural-500 dark:text-natural-400">{index + 1}</td>
                                    <td className="px-4 py-3 font-medium text-natural-800 dark:text-natural-100">{report.name}</td>
                                    <td className="px-4 py-3 text-natural-600 dark:text-natural-300">{formatDate(report.date)}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => printReport(report.content, report.name)} className="text-dark-purple-600 dark:text-dark-purple-400 hover:underline font-semibold">
                                            {labels.viewDownload}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-natural-500">{labels.noReports}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Reports;