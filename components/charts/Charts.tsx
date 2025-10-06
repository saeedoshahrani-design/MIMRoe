import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Label, LabelList } from 'recharts';
import { useLocalization } from '../../hooks/useLocalization';
import { useChartTheme, STATUS_COLORS, PERFORMANCE_COLORS, CATEGORY_COLORS, TREND_COLORS, STATUS_DONUT_COLORS, CATEGORY_DONUT_COLORS } from '../../utils/chartUtils';
import { locales } from '../../i18n/locales';

interface ChartProps {
    data: any[];
    onSegmentClick?: (payload: any) => void;
    isLoading?: boolean;
}

const ChartSkeleton: React.FC = () => (
    <div className="w-full h-full flex items-end justify-between px-8 pb-10 animate-pulse">
        <div className="w-8 h-1/3 bg-natural-200 dark:bg-natural-700 rounded-t-md"></div>
        <div className="w-8 h-2/3 bg-natural-200 dark:bg-natural-700 rounded-t-md"></div>
        <div className="w-8 h-1/2 bg-natural-200 dark:bg-natural-700 rounded-t-md"></div>
        <div className="w-8 h-3/4 bg-natural-200 dark:bg-natural-700 rounded-t-md"></div>
        <div className="w-8 h-1/2 bg-natural-200 dark:bg-natural-700 rounded-t-md"></div>
        <div className="w-8 h-2/4 bg-natural-200 dark:bg-natural-700 rounded-t-md"></div>
        <div className="w-8 h-1/3 bg-natural-200 dark:bg-natural-700 rounded-t-md"></div>
    </div>
);


const ChartWrapper: React.FC<{ children: React.ReactNode, data: any[], isLoading?: boolean, emptyMessage: string }> = ({ children, data, isLoading, emptyMessage }) => {
    if (isLoading) {
        return <ChartSkeleton />;
    }
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-natural-400 p-4 text-center text-sm">{emptyMessage}</div>;
    }
    return <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>;
};

const CategoricalTooltip: React.FC<any> = ({ active, payload, label, formatNumber, isRtl, legendFormatter }) => {
    const themeStyles = useChartTheme();
    if (active && payload && payload.length) {
        const isPieChart = !!payload[0].percent;
        const total = isPieChart ? payload.reduce((sum: number, entry: any) => sum + entry.value, 0) : payload[0].payload.total;

        return (
            <div className="p-3 rounded-md shadow-lg" style={themeStyles.tooltip as React.CSSProperties}>
                <p className="font-bold mb-1 text-sm">{isPieChart ? payload[0].name : label}</p>
                {payload.map((entry: any, index: number) => {
                     const value = entry.value;
                     const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                     const displayName = legendFormatter ? legendFormatter(entry.name) : entry.name;
                    return (
                        <div key={`item-${index}`} className="flex items-center text-xs" dir={isRtl ? 'rtl' : 'ltr'}>
                             <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.payload.fill, marginLeft: isRtl ? '0.5rem' : '0', marginRight: isRtl ? '0' : '0.5rem' }}></div>
                             <span>{`${displayName}: `}</span>
                             <span className="font-semibold" style={{ marginLeft: isRtl ? '0' : '0.25rem', marginRight: isRtl ? '0.25rem' : '0' }}>{formatNumber(value)} ({formatNumber(percentage)}%)</span>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

const CustomizedXAxisTick = (props: any) => {
    const { x, y, payload, fill } = props;
    const value = payload.value;
    const lineLength = 16;

    if (value.length <= lineLength) {
        return (
            <g transform={`translate(${x},${y})`}>
                <title>{value}</title>
                <text x={0} y={0} dy={16} textAnchor="middle" fill={fill} fontSize={12}>
                    {value}
                </text>
            </g>
        );
    }

    const words = value.split(' ');
    let line1 = '';
    let line2 = '';
    for (const word of words) {
        if ((line1 + ' ' + word).trim().length <= lineLength) {
            line1 = (line1 + ' ' + word).trim();
        } else {
            line2 = (line2 + ' ' + word).trim();
        }
    }

    return (
        <g transform={`translate(${x},${y})`}>
            <title>{value}</title>
            <text x={0} y={0} dy={12} textAnchor="middle" fill={fill} fontSize={12}>
                <tspan x="0" dy="0">{line1}</tspan>
                {line2 && <tspan x="0" dy="15">{line2.length > lineLength ? line2.substring(0, lineLength-1) + '…' : line2}</tspan>}
            </text>
        </g>
    );
};


export const DepartmentsComparisonChart: React.FC<ChartProps> = ({ data, onSegmentClick, isLoading }) => {
    const { t, language } = useLocalization();
    const { isRtl, formatNumber, ...themeStyles } = useChartTheme();
    
    const [hoveredDept, setHoveredDept] = useState<string | null>(null);
    const allStatuses = useMemo(() => Object.keys(STATUS_COLORS), []);
    const [activeLegend, setActiveLegend] = useState<string[]>(allStatuses);

    const processedData = useMemo(() => 
        [...data].sort((a, b) => b.total - a.total), 
        [data]
    );

    const legendFormatter = (value: string) => {
        const statusTranslations = locales[language].dashboard.chartStatus;
        return statusTranslations[value as keyof typeof statusTranslations] || value;
    };

    const handleLegendClick = (dataKey: string) => {
        if (activeLegend.includes(dataKey)) {
            setActiveLegend(activeLegend.filter(i => i !== dataKey));
        } else {
            setActiveLegend([...activeLegend, dataKey]);
        }
    };
    
    const LegendPill: React.FC<{ dataKey: string, color: string }> = ({ dataKey, color }) => {
        const isActive = activeLegend.includes(dataKey);
        return (
             <button
                onClick={() => handleLegendClick(dataKey)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                    isActive ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                }`}
             >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}/>
                <span>{legendFormatter(dataKey)}</span>
            </button>
        );
    };

    // The status that is at the top of the stack
    const topStatus = 'مغلق';

    return (
        <div className="w-full h-full flex flex-col">
             <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 my-3 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
                {allStatuses.map(status => (
                    <LegendPill key={status} dataKey={status} color={STATUS_COLORS[status]} />
                ))}
            </div>
            <div className="flex-grow">
                <ChartWrapper data={data} isLoading={isLoading} emptyMessage={t('dashboard.charts.departmentsComparisonEmpty')}>
                    <BarChart 
                        data={processedData} 
                        margin={{ top: 20, right: isRtl ? 10 : 30, left: isRtl ? 30 : 0, bottom: 30 }}
                        onMouseMove={(state) => {
                            if (state.isTooltipActive) {
                                setHoveredDept(state.activePayload?.[0].payload.name);
                            } else {
                                setHoveredDept(null);
                            }
                        }}
                        onMouseLeave={() => setHoveredDept(null)}
                    >
                        <CartesianGrid strokeDasharray="2 3" stroke={themeStyles.grid.stroke} vertical={true} horizontal={true} />
                        <XAxis 
                            type="category" 
                            dataKey="name" 
                            tick={<CustomizedXAxisTick fill={themeStyles.tick.fill} />}
                            stroke={themeStyles.tick.fill} 
                            height={50}
                            interval={0}
                            reversed={isRtl}
                            tickMargin={12}
                        >
                             <Label value={t('dashboard.axis.departments')} offset={-25} position="insideBottom" {...themeStyles.label} />
                        </XAxis>
                        <YAxis 
                            type="number" 
                            tickFormatter={formatNumber}
                            tick={{...themeStyles.tick, textAnchor: isRtl ? 'start' : 'end'}} 
                            stroke={themeStyles.tick.fill} 
                            allowDecimals={false} 
                            orientation={isRtl ? 'right' : 'left'}
                        >
                            <Label value={t('dashboard.axis.count')} angle={-90} offset={isRtl ? -20 : 15} position={isRtl ? 'insideRight' : 'insideLeft'} style={{ textAnchor: 'middle', fontWeight: 600, ...themeStyles.label }} />
                        </YAxis>
                        <Tooltip content={<CategoricalTooltip formatNumber={formatNumber} isRtl={isRtl} legendFormatter={legendFormatter} />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}/>
                        {allStatuses.map((status) => (
                            <Bar 
                                key={status} 
                                dataKey={status} 
                                stackId="a"
                                barSize={24}
                                onClick={(payload) => onSegmentClick?.({ department: payload.name, status })}
                                name={status}
                                hide={!activeLegend.includes(status)}
                            >
                                {processedData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`}
                                        fill={STATUS_COLORS[status]}
                                        fillOpacity={hoveredDept && hoveredDept !== entry.name ? 0.3 : 1}
                                        radius={[4, 4, 0, 0]}
                                    />
                                ))}
                                {status === topStatus && (
                                     <LabelList 
                                        dataKey="total"
                                        position="top"
                                        formatter={(value: number) => value > 0 ? formatNumber(value) : ''}
                                        style={{ fontSize: 10, fill: themeStyles.label.fill, fontWeight: 500 }}
                                        offset={4}
                                    />
                                )}
                            </Bar>
                        ))}
                    </BarChart>
                </ChartWrapper>
            </div>
        </div>
    );
};

export const SummaryDonutChart: React.FC<{
    data: { name: string; value: number }[];
    title: string;
    colors: Record<string, string>;
    isLoading?: boolean;
}> = ({ data, title, colors, isLoading }) => {
    const { t } = useLocalization();
    const { isRtl, formatNumber, ...themeStyles } = useChartTheme();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const total = useMemo(() => data.reduce((sum, entry) => sum + entry.value, 0), [data]);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(null);
    };
    
    const activeData = activeIndex !== null ? data[activeIndex] : null;
    const activePercentage = activeData && total > 0 ? ((activeData.value / total) * 100).toFixed(0) : null;

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="font-bold text-md text-natural-800 dark:text-natural-100 px-4 pt-2 text-center">{title}</h3>
            <div className="flex-grow">
                <ChartWrapper data={data} isLoading={isLoading} emptyMessage={t('dashboard.charts.noData')}>
                    <PieChart>
                        <Tooltip content={<CategoricalTooltip formatNumber={formatNumber} isRtl={isRtl} />} />
                        <Pie
                            data={data}
                            cx="50%"
                            cy="45%"
                            innerRadius="60%"
                            outerRadius="80%"
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                            onMouseLeave={onPieLeave}
                            paddingAngle={data.length > 1 ? 2 : 0}
                            cornerRadius={4}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[entry.name] || '#ccc'} fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.4} stroke="none" />
                            ))}
                            <Label 
                                width={100}
                                position="center"
                                content={({ viewBox }) => {
                                    const { cx, cy } = viewBox;
                                    return (
                                        <g>
                                            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '24px', fontWeight: 'bold', fill: themeStyles.tick.fill }}>
                                                {activeIndex !== null && activePercentage ? `${formatNumber(activePercentage)}%` : formatNumber(total)}
                                            </text>
                                            {activeIndex !== null && activeData && (
                                                <text x={cx} y={cy + 20} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '12px', fill: themeStyles.tick.fill }}>
                                                    {activeData.name}
                                                </text>
                                            )}
                                        </g>
                                    );
                                }} 
                            />
                        </Pie>
                        <Legend 
                            iconType="circle"
                            wrapperStyle={{ direction: isRtl ? 'rtl' : 'ltr', fontSize: '12px', ...themeStyles.legend, paddingTop: '10px' }}
                        />
                    </PieChart>
                </ChartWrapper>
            </div>
        </div>
    );
};

export const PerformanceStatusChart: React.FC<ChartProps> = ({ data, onSegmentClick, isLoading }) => {
    const { t } = useLocalization();
    const { isRtl, formatNumber, ...themeStyles } = useChartTheme();
    
    const chartData = data.map(item => ({...item, name: t(`challenges.performanceStatus.${item.name}`)}));

    return (
         <ChartWrapper data={chartData} isLoading={isLoading} emptyMessage={t('dashboard.charts.noData')}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.grid.stroke}/>
                <XAxis dataKey="name" tick={themeStyles.tick} stroke={themeStyles.tick.fill} reversed={isRtl}/>
                <YAxis tick={{...themeStyles.tick, textAnchor: isRtl ? 'start' : 'end'}} stroke={themeStyles.tick.fill} orientation={isRtl ? 'right' : 'left'} tickFormatter={formatNumber}/>
                <Tooltip content={<CategoricalTooltip formatNumber={formatNumber} isRtl={isRtl} />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}/>
                <Bar dataKey="value" radius={[4, 4, 0, 0]} onClick={(payload) => {
                    const originalName = data.find(d => t(`challenges.performanceStatus.${d.name}`) === payload.name)?.name;
                    onSegmentClick?.({ name: originalName });
                }}>
                    {chartData.map((entry, index) => {
                        const originalName = data.find(d => t(`challenges.performanceStatus.${d.name}`) === entry.name)?.name;
                        return <Cell key={`cell-${index}`} fill={PERFORMANCE_COLORS[originalName as keyof typeof PERFORMANCE_COLORS]} />
                    })}
                </Bar>
            </BarChart>
         </ChartWrapper>
    );
};


export const CategoryBreakdownChart: React.FC<ChartProps> = ({ data, onSegmentClick, isLoading }) => {
    const { t } = useLocalization();
    const { isRtl, formatNumber } = useChartTheme();

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null; // Hide label for very small slices
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold pointer-events-none">
                {formatNumber(Math.round(percent * 100))}%
            </text>
        );
    };

    return (
        <ChartWrapper data={data} isLoading={isLoading} emptyMessage={t('dashboard.charts.noData')}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={'80%'}
                    innerRadius={'50%'}
                    dataKey="value"
                    onClick={(payload) => onSegmentClick?.(payload)}
                    cornerRadius={4}
                    paddingAngle={2}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} stroke="none" />
                    ))}
                </Pie>
                <Tooltip content={<CategoricalTooltip formatNumber={formatNumber} isRtl={isRtl} />} />
                <Legend iconType="circle" wrapperStyle={{ direction: isRtl ? 'rtl' : 'ltr' }} />
            </PieChart>
        </ChartWrapper>
    );
};

export const MonthlyTrendsChart: React.FC<ChartProps> = ({ data, isLoading }) => {
    const { t } = useLocalization();
    const { isRtl, formatNumber, ...themeStyles } = useChartTheme();
    
    return (
        <ChartWrapper data={data} isLoading={isLoading} emptyMessage={t('dashboard.charts.noData')}>
            <ComposedChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.grid.stroke} />
                <XAxis dataKey="name" tick={themeStyles.tick} stroke={themeStyles.tick.fill} reversed={isRtl}/>
                <YAxis tick={{...themeStyles.tick, textAnchor: isRtl ? 'start' : 'end'}} stroke={themeStyles.tick.fill} orientation={isRtl ? 'right' : 'left'} tickFormatter={formatNumber}/>
                <Tooltip content={<CategoricalTooltip formatNumber={formatNumber} isRtl={isRtl} />} />
                <Legend wrapperStyle={{ ...themeStyles.legend, direction: isRtl ? 'rtl' : 'ltr' }} />
                <Bar dataKey="created" barSize={20} fill={TREND_COLORS.created} name={t('dashboard.charts.created')} radius={[4,4,0,0]} />
                <Line type="monotone" dataKey="completed" stroke={TREND_COLORS.completed} strokeWidth={2} name={t('dashboard.charts.completed')} />
            </ComposedChart>
        </ChartWrapper>
    );
};