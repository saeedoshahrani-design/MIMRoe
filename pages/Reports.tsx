
import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import Card from '../components/Card';
import PageTitle from '../components/PageTitle';

const KpiCard: React.FC<{ title: string; score: string; description: string }> = ({ title, score, description }) => (
    <Card>
        <div className="flex justify-between items-baseline">
            <h3 className="font-bold text-natural-800 dark:text-natural-100">{title}</h3>
            <span className="text-2xl font-bold text-bright-blue-500">{score}</span>
        </div>
        <p className="mt-2 text-sm text-natural-500 dark:text-natural-400">{description}</p>
    </Card>
);

const Reports: React.FC = () => {
    const { t } = useLocalization();

    return (
        <div className="space-y-6">
            <PageTitle />
            <Card>
                <h3 className="text-xl font-bold">{t('reports.outputsReporting')}</h3>
                <p className="mt-2 text-natural-600 dark:text-natural-300">{t('reports.weeklySummaryText')}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="md:col-span-2">
                     <h3 className="text-lg font-bold mb-4">{t('reports.kpiSummary')}</h3>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <KpiCard title="Challenge Resolution Rate" score="85%" description="Percentage of challenges resolved within the target date." />
                        <KpiCard title="Avg. Impact Score" score="Medium" description="Average impact of all open challenges." />
                        <KpiCard title="New Opportunities" score="+12" description="New improvement opportunities identified this period." />
                     </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-bold">{t('reports.proposedKpiSummary')}</h3>
                    <p className="mt-2 text-sm text-natural-500 dark:text-natural-400">Review proposed KPIs for the next quarter.</p>
                </Card>

                <Card>
                    <h3 className="text-lg font-bold">{t('reports.overallKpiScore')}</h3>
                     <div className="flex items-center justify-center h-full">
                        <p className="text-6xl font-bold text-dark-purple-500">A-</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;