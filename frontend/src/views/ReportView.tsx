import React, { useState, useEffect, useCallback } from 'react';
import { ReportMetrics, TimeSeriesData } from '../types';
import api from '../services/api';
import Spinner from '../components/common/Spinner';
import { FaChartLine, FaClock, FaCoffee, FaHourglassHalf, FaCalendarDay, FaCalendarWeek, FaCalendarAlt } from 'react-icons/fa';
import { Switch } from '@headlessui/react';

const IconWrapper: React.FC<{ IconComponent: any }> = ({ IconComponent }) => <IconComponent />;

const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    const m = Math.floor(seconds / 60);
    return `${m}分钟`;
};

const DataCard: React.FC<{ title: string; value: string; icon: React.ReactNode; className?: string }> = ({ title, value, icon, className }) => (
    <div className={`bg-slate-800/50 p-4 rounded-lg flex items-center ${className}`}>
        <div className="p-3 mr-4 bg-slate-700/50 rounded-full text-blue-300">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    </div>
);

// 简化的图表组件，使用CSS和HTML实现
const SimpleChart: React.FC<{ data: TimeSeriesData[], chartType: 'line' | 'bar' }> = ({ data, chartType }) => {
    const formattedData = data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        totalStudyTime: Math.round(d.totalStudyTime / 60),
        focusedTime: Math.round(d.focusedTime / 60),
    }));

    const maxValue = Math.max(...formattedData.map(d => Math.max(d.totalStudyTime, d.focusedTime)));

    if (chartType === 'bar') {
        return (
            <div className="w-full h-80 bg-slate-800/30 rounded-lg p-4">
                <div className="flex justify-between items-end h-full">
                    {formattedData.map((item, index) => (
                        <div key={index} className="flex flex-col items-center flex-1 mx-1">
                            <div className="flex items-end justify-center w-full h-64 mb-2">
                                <div className="flex items-end space-x-1 w-full justify-center">
                                    <div 
                                        className="bg-blue-500 rounded-t min-w-[8px] flex-1 max-w-[20px]"
                                        style={{ height: `${(item.totalStudyTime / maxValue) * 200}px` }}
                                        title={`总修行时间: ${item.totalStudyTime}分钟`}
                                    />
                                    <div 
                                        className="bg-green-500 rounded-t min-w-[8px] flex-1 max-w-[20px]"
                                        style={{ height: `${(item.focusedTime / maxValue) * 200}px` }}
                                        title={`专注时间: ${item.focusedTime}分钟`}
                                    />
                                </div>
                            </div>
                            <span className="text-xs text-slate-400">{item.date}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center mt-4 space-x-4">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                        <span className="text-sm text-slate-400">总修行时间</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                        <span className="text-sm text-slate-400">专注时间</span>
                    </div>
                </div>
            </div>
        );
    }

    // 简化的折线图实现
    return (
        <div className="w-full h-80 bg-slate-800/30 rounded-lg p-4">
            <div className="relative h-64 mb-4">
                <svg className="w-full h-full">
                    {/* 网格线 */}
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* 数据点和线条 */}
                    {formattedData.map((item, index) => {
                        const x = (index / (formattedData.length - 1)) * 100;
                        const totalY = 100 - (item.totalStudyTime / maxValue) * 80;
                        const focusY = 100 - (item.focusedTime / maxValue) * 80;
                        
                        return (
                            <g key={index}>
                                {/* 总修行时间点 */}
                                <circle 
                                    cx={`${x}%`} 
                                    cy={`${totalY}%`} 
                                    r="4" 
                                    fill="#38bdf8"
                                    className="hover:r-6 transition-all"
                                >
                                    <title>{`${item.date}: 总修行时间 ${item.totalStudyTime}分钟`}</title>
                                </circle>
                                
                                {/* 专注时间点 */}
                                <circle 
                                    cx={`${x}%`} 
                                    cy={`${focusY}%`} 
                                    r="4" 
                                    fill="#34d399"
                                    className="hover:r-6 transition-all"
                                >
                                    <title>{`${item.date}: 专注时间 ${item.focusedTime}分钟`}</title>
                                </circle>
                                
                                {/* 连接线 */}
                                {index > 0 && (
                                    <>
                                        <line
                                            x1={`${((index - 1) / (formattedData.length - 1)) * 100}%`}
                                            y1={`${100 - (formattedData[index - 1].totalStudyTime / maxValue) * 80}%`}
                                            x2={`${x}%`}
                                            y2={`${totalY}%`}
                                            stroke="#38bdf8"
                                            strokeWidth="2"
                                        />
                                        <line
                                            x1={`${((index - 1) / (formattedData.length - 1)) * 100}%`}
                                            y1={`${100 - (formattedData[index - 1].focusedTime / maxValue) * 80}%`}
                                            x2={`${x}%`}
                                            y2={`${focusY}%`}
                                            stroke="#34d399"
                                            strokeWidth="2"
                                        />
                                    </>
                                )}
                            </g>
                        );
                    })}
                </svg>
                
                {/* X轴标签 */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                    {formattedData.map((item, index) => (
                        <span key={index} className="text-xs text-slate-400">{item.date}</span>
                    ))}
                </div>
            </div>
            
            <div className="flex justify-center space-x-4">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                    <span className="text-sm text-slate-400">总修行时间</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                    <span className="text-sm text-slate-400">专注时间</span>
                </div>
            </div>
        </div>
    );
};

const ReportView: React.FC = () => {
    const [reports, setReports] = useState<{ [key: string]: ReportMetrics | null }>({ latest: null, daily: null, weekly: null, monthly: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartType, setChartType] = useState<'line' | 'bar'>('bar');

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const periods = ['latest', 'daily', 'weekly', 'monthly'];
            const requests = periods.map(period => api.reports.getReport(period).catch((e: any) => ({ data: null, error: e })));
            
            const responses = await Promise.all(requests);
            const newReports: { [key: string]: ReportMetrics | null } = {};
            responses.forEach((res: any, index: number) => {
                newReports[periods[index]] = res.data || null;
            });
            setReports(newReports);
        } catch (err: any) {
            setError('获取报告失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const renderSummarySection = (title: string, data: ReportMetrics | null, icon: React.ReactNode) => {
        if (!data || data.totalStudyTime === 0) {
            return null;
        }

        const focusRate = data.focusRate ?? 0;

        return (
            <div className="bg-slate-800/30 p-6 rounded-xl mb-8">
                <h3 className="text-xl font-bold mb-4 text-slate-200 flex items-center">{icon}<span className="ml-2">{title}</span></h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <DataCard title="总修行时间" value={formatDuration(data.totalStudyTime)} icon={<IconWrapper IconComponent={FaClock} />} />
                    <DataCard title="总专注时间" value={formatDuration(data.focusedTime)} icon={<IconWrapper IconComponent={FaChartLine} />} />
                    <DataCard title="专注时间占比" value={`${focusRate.toFixed(1)}%`} icon={<IconWrapper IconComponent={FaHourglassHalf} />} />
                    <DataCard title="休息次数" value={`${data.breakCount} 次`} icon={<IconWrapper IconComponent={FaCoffee} />} />
                    <DataCard title="总休息时长" value={formatDuration(data.totalBreakTime)} icon={<IconWrapper IconComponent={FaClock} />} />
                    <DataCard title="专注率" value={`${focusRate.toFixed(1)}%`} icon={<IconWrapper IconComponent={FaChartLine} />} />
                </div>
            </div>
        );
    };

    const renderChartSection = (title: string, data: ReportMetrics | null, icon: React.ReactNode) => {
        if (!data || !data.timeSeries || data.timeSeries.length === 0) {
            return (
                <div className="bg-slate-800/30 p-6 rounded-xl mb-8">
                    <h3 className="text-xl font-bold mb-4 text-slate-200 flex items-center">{icon}<span className="ml-2">{title}</span></h3>
                    <p className="text-slate-400">暂无足够数据生成图表。</p>
                </div>
            );
        }

        return (
            <div className="bg-slate-800/30 p-6 rounded-xl mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-200 flex items-center">{icon}<span className="ml-2">{title}</span></h3>
                    <div className="flex items-center">
                        <span className="text-sm mr-2 text-slate-400">柱状图</span>
                        <Switch
                            checked={chartType === 'line'}
                            onChange={() => setChartType(prev => prev === 'line' ? 'bar' : 'line')}
                            className={`${chartType === 'line' ? 'bg-blue-600' : 'bg-slate-700'}
                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                        >
                            <span className={`${chartType === 'line' ? 'translate-x-6' : 'translate-x-1'}
                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </Switch>
                        <span className="text-sm ml-2 text-slate-400">折线图</span>
                    </div>
                </div>
                <SimpleChart data={data.timeSeries} chartType={chartType} />
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-8">修行报告</h2>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20"><Spinner /></div>
                ) : error ? (
                    <div className="text-center py-20 bg-slate-800/50 rounded-xl">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button onClick={fetchReports} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">重试</button>
                    </div>
                ) : !Object.values(reports).some(r => r && r.totalStudyTime > 0) ? (
                    <div className="text-center py-20 bg-slate-800/50 rounded-xl">
                        <p className="text-slate-400">暂无修行数据，开始一次专注学习来生成你的第一份报告吧！</p>
                    </div>
                ) : (
                    <>
                        {renderSummarySection('最近修行', reports.latest, <IconWrapper IconComponent={FaCalendarDay} />)}
                        {renderSummarySection('本日修行', reports.daily, <IconWrapper IconComponent={FaCalendarDay} />)}
                        {renderChartSection('本周回顾', reports.weekly, <IconWrapper IconComponent={FaCalendarWeek} />)}
                        {renderChartSection('本月回顾', reports.monthly, <IconWrapper IconComponent={FaCalendarAlt} />)}
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportView;
