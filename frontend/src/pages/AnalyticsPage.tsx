import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  Building,
  Download,
  FileSpreadsheet,
  FileText,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { api } from '../services/api';
import { ScenarioListItem, SimulationRun } from '../types/scenario';

export const AnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadScenariosAndAnalytics();
  }, [id]);

  const loadScenariosAndAnalytics = async () => {
    setLoading(true);
    try {
      const scenList = await api.getScenarios();
      setScenarios(scenList);

      let targetId = id;
      if (!targetId || targetId === 'default') {
        if (scenList.length > 0) targetId = scenList[0].id;
      }

      if (targetId) {
        setSelectedScenarioId(targetId);
        const run = await api.getLatestSimulationRun(targetId);
        const data = await api.getSimulationAnalytics(run.id);
        setAnalyticsData(data);
      }
    } catch (e) {
      console.error('Error loading analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = async (scenId: string) => {
    setSelectedScenarioId(scenId);
    setLoading(true);
    try {
      const run = await api.getLatestSimulationRun(scenId);
      const data = await api.getSimulationAnalytics(run.id);
      setAnalyticsData(data);
    } catch (e) {
      console.error(e);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const metrics = analyticsData?.summary_metrics;
  const progressCurve = analyticsData?.progress_curve || [];
  const shelterComparison = analyticsData?.shelter_comparison || [];
  const bottlenecks = analyticsData?.bottlenecks || [];
  const travelDistribution = analyticsData?.travel_time_distribution || [];

  // Pie chart data for evacuated vs remaining vs unreachable
  const populationSplit = metrics
    ? [
        { name: 'Evacuated', value: metrics.successfully_evacuated, fill: '#10B981' },
        { name: 'Remaining/Transit', value: metrics.remaining_population, fill: '#0284C7' },
        { name: 'Unreachable', value: metrics.unable_to_reach, fill: '#EF4444' },
      ]
    : [];

  // Top road congestion data
  const congestionBarData = bottlenecks.slice(0, 6).map((b: any) => ({
    name: b.road_name,
    ratio: Math.round(b.congestion_ratio * 100),
    delay: b.average_delay_seconds,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Simulation Analytics & Quantitative Metrics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical results computed from discrete-time agent movement and network capacity constraints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {scenarios.length > 0 && (
            <select
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="bg-navy-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {analyticsData && (
            <div className="flex items-center gap-2">
              <a
                href={api.getReportCsvUrl(analyticsData.run_id)}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </a>
              <a
                href={api.getReportPdfUrl(analyticsData.run_id)}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-md shadow-blue-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 14 Quantitative Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pop</span>
            <span className="text-lg font-mono font-black text-white">{metrics.total_population}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Evacuated</span>
            <span className="text-lg font-mono font-black text-emerald-400">{metrics.successfully_evacuated}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
            <span className="text-lg font-mono font-black text-cyan-400">{metrics.remaining_population}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Unreachable</span>
            <span className="text-lg font-mono font-black text-red-400">{metrics.unable_to_reach}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Clearance Rate</span>
            <span className="text-lg font-mono font-black text-emerald-400">{metrics.evacuation_rate_pct}%</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Clearance</span>
            <span className="text-lg font-mono font-black text-cyan-300">{metrics.avg_evacuation_time_min}m</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Congestion</span>
            <span className="text-lg font-mono font-black text-amber-400">{metrics.max_congestion_ratio}x</span>
          </div>

          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Bottlenecks</span>
            <span className="text-lg font-mono font-black text-amber-400">{metrics.bottlenecks_detected_count}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Roads Closed</span>
            <span className="text-lg font-mono font-black text-red-400">{metrics.blocked_roads_count}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Shelter Cap</span>
            <span className="text-lg font-mono font-black text-white">{metrics.total_shelter_capacity}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Shelter Util</span>
            <span className="text-lg font-mono font-black text-emerald-400">{metrics.total_shelter_utilization_pct}%</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Duration</span>
            <span className="text-lg font-mono font-black text-slate-200">{metrics.total_simulation_time_min}m</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Recalculations</span>
            <span className="text-lg font-mono font-black text-cyan-400">{metrics.route_recalculations_count}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-900/80 border border-slate-800 shadow">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Cap Shortage</span>
            <span className="text-lg font-mono font-black text-slate-200">
              {Math.max(0, metrics.total_population - metrics.total_shelter_capacity)}
            </span>
          </div>
        </div>
      )}

      {/* Main Analytical Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Timeline Curve */}
        <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Evacuation Clearance Curve Over Time
            </h2>
            <span className="text-xs text-slate-400">Step Progression (Minutes)</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressCurve}>
                <defs>
                  <linearGradient id="anEvacGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time_min" stroke="#64748B" fontSize={11} label={{ value: 'Simulation Time (min)', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0B1528', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="evacuated" name="Evacuated" stroke="#10B981" fill="url(#anEvacGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="in_transit" name="In Transit" stroke="#0284C7" fill="#0284C7" fillOpacity={0.2} strokeWidth={2} />
                <Area type="monotone" dataKey="unreachable" name="Unreachable" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shelter Utilization Capacity Comparison */}
        <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              Shelter Occupancy vs Maximum Capacity
            </h2>
            <span className="text-xs text-slate-400">Intake Quotas</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shelterComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0B1528', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="occupancy" name="Current Occupants" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacity" name="Max Capacity" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Road Congestion Ranking Bar Chart */}
        <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Road Demand vs Capacity Ratio (%)
            </h2>
            <span className="text-xs text-slate-400">100% = Design Limit</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={congestionBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={10} width={130} />
                <Tooltip contentStyle={{ backgroundColor: '#0B1528', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
                <Bar dataKey="ratio" name="Demand Ratio (%)" fill="#F59E0B" radius={[0, 4, 4, 0]}>
                  {congestionBarData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.ratio >= 125 ? '#DC2626' : (entry.ratio >= 100 ? '#F97316' : '#FBBF24')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Travel Time Distribution */}
        <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Evacuation Clearance Time Distribution
            </h2>
            <span className="text-xs text-slate-400">Agent Arrival Histogram</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={travelDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="range" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0B1528', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
                <Bar dataKey="count" name="Evacuees" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
