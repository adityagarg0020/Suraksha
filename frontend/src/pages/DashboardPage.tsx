import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  Percent,
  AlertTriangle,
  Building,
  Play,
  PlusCircle,
  GitCompare,
  FileText,
  Shield,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  Cell
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';
import { ScenarioListItem, SimulationRun } from '../types/scenario';

export const DashboardPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [latestRun, setLatestRun] = useState<SimulationRun | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const scenList = await api.getScenarios();
      setScenarios(scenList);

      if (scenList.length > 0) {
        // Load latest run from first scenario
        try {
          const run = await api.getLatestSimulationRun(scenList[0].id);
          setLatestRun(run);
        } catch {
          // If no run yet, that's handled
        }
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = latestRun?.summary_metrics;
  const snapshots = latestRun?.step_snapshots || [];
  const bottlenecks = latestRun?.bottlenecks || [];
  const recommendations = latestRun?.recommendations || [];

  // Transform snapshots into timeline chart data
  const progressData = snapshots.map((s) => ({
    time: `${s.simulated_time_min}m`,
    evacuated: s.evacuated_count,
    in_transit: s.moving_count,
    waiting: s.waiting_count,
    unreachable: s.unreachable_count,
  }));

  // Shelter bars data
  const shelterData = latestRun?.step_snapshots.length
    ? Object.entries(latestRun.step_snapshots[latestRun.step_snapshots.length - 1].shelter_occupancy).map(([sid, occ]) => ({
        id: sid,
        name: sid.includes('S1') ? 'North High' : (sid.includes('S2') ? 'East Sports' : (sid.includes('S3') ? 'South Medical' : 'West Arena')),
        occupancy: occ,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Emergency Operations Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analysis of simulated disaster evacuation drills across Greenfield City.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/scenarios/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Scenario</span>
          </Link>
          {scenarios.length > 0 && (
            <Link
              to={`/simulation/${scenarios[0].id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-semibold text-xs transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Drill</span>
            </Link>
          )}
          <Link
            to="/compare"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition"
          >
            <GitCompare className="w-4 h-4" />
            <span>Compare</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          label="Total Population"
          value={metrics ? metrics.total_population.toLocaleString() : '—'}
          unit="agents"
          icon={Users}
          description="Simulated synthetic population units."
          status="normal"
        />
        <MetricCard
          label="Evacuated"
          value={metrics ? metrics.successfully_evacuated.toLocaleString() : '—'}
          unit="safe"
          icon={CheckCircle}
          description="Virtual evacuees arrived at designated shelter."
          status="success"
        />
        <MetricCard
          label="Remaining"
          value={metrics ? metrics.remaining_population.toLocaleString() : '—'}
          unit="in network"
          icon={Clock}
          description="Agents en route or awaiting departure."
          status={metrics && metrics.remaining_population > 0 ? "warning" : "normal"}
        />
        <MetricCard
          label="Completion Rate"
          value={metrics ? `${metrics.evacuation_rate_pct}%` : '—'}
          icon={Percent}
          description="Overall clearance percentage achieved."
          status={metrics && metrics.evacuation_rate_pct >= 90 ? "success" : "warning"}
        />
        <MetricCard
          label="Bottlenecks"
          value={metrics ? metrics.bottlenecks_detected_count : '—'}
          unit="roads"
          icon={AlertTriangle}
          description="Roads exceeding design capacity threshold."
          status={metrics && metrics.bottlenecks_detected_count > 0 ? "danger" : "success"}
        />
        <MetricCard
          label="Shelter Utilization"
          value={metrics ? `${metrics.total_shelter_utilization_pct}%` : '—'}
          icon={Building}
          description="Aggregated occupancy vs available capacity."
          status={metrics && metrics.total_shelter_utilization_pct >= 90 ? "warning" : "normal"}
        />
      </div>

      {/* Main Charts & Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evacuation Progress Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Evacuation Clearance Progress Over Time
              </h2>
              <span className="text-xs text-slate-400">
                Discrete-time step progression ({latestRun?.scenario_name || 'Drill'})
              </span>
            </div>
            {latestRun && (
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                Duration: {latestRun.summary_metrics.total_simulation_time_min} min
              </span>
            )}
          </div>

          {progressData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="evacGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="movingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1528', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                    itemStyle={{ color: '#F8FAFC' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="evacuated" name="Successfully Evacuated" stroke="#10B981" fill="url(#evacGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="in_transit" name="In Transit" stroke="#0284C7" fill="url(#movingGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="unreachable" name="Unreachable" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-500 text-xs">
              <Play className="w-8 h-8 text-slate-600 mb-2" />
              <span>No active simulation run recorded yet. Run a scenario drill to generate live progress.</span>
            </div>
          )}
        </div>

        {/* Shelter Utilization Bar Chart */}
        <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                Shelter Intake Load
              </h2>
              <Link to="/shelters" className="text-xs text-cyan-400 hover:underline">
                Manage
              </Link>
            </div>

            {shelterData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shelterData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                    <XAxis type="number" stroke="#64748B" fontSize={10} />
                    <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B1528', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                    />
                    <Bar dataKey="occupancy" name="Assigned Evacuees" fill="#06B6D4" radius={[0, 4, 4, 0]}>
                      {shelterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.occupancy >= 200 ? '#F59E0B' : '#10B981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                No shelter occupancy data recorded.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
            <span>Overall Capacity: {metrics?.total_shelter_capacity || 830} beds</span>
            <span className="font-semibold text-emerald-400">Zero Over-Allocation</span>
          </div>
        </div>
      </div>

      {/* Lower Grid: Bottlenecks & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Congested Simulated Roads */}
        <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Critical Bottlenecks & Monitored Corridors
            </h2>
            <span className="text-xs text-slate-400">{bottlenecks.length} Identified</span>
          </div>

          {bottlenecks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2">Road Corridor</th>
                    <th className="pb-2">Load/Cap</th>
                    <th className="pb-2">Ratio</th>
                    <th className="pb-2">Severity</th>
                    <th className="pb-2">Delay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bottlenecks.slice(0, 4).map((b) => (
                    <tr key={b.road_id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-medium text-slate-200">
                        {b.road_name}
                        <span className="block text-[10px] text-slate-400 font-mono">{b.road_id}</span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-300">
                        {b.simulated_load} / {b.configured_capacity}
                      </td>
                      <td className="py-2.5 font-mono font-bold text-amber-400">
                        {b.congestion_ratio}x
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.category === 'Critical'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {b.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400 font-mono">+{b.average_delay_seconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 text-xs">
              No critical bottlenecks detected under current scenario parameters.
            </div>
          )}
        </div>

        {/* Rule-Based Mitigation Recommendations */}
        <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Rule-Based Operational Recommendations
            </h2>
            <Link to="/reports" className="text-xs text-cyan-400 hover:underline">
              Full Report
            </Link>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((r, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white">{r.title}</span>
                    <span
                      className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded border ${
                        r.severity === 'Critical'
                          ? 'bg-red-900/30 text-red-400 border-red-800/40'
                          : r.severity === 'High'
                          ? 'bg-orange-900/30 text-orange-400 border-orange-800/40'
                          : 'bg-blue-900/30 text-blue-400 border-blue-800/40'
                      }`}
                    >
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-1">{r.problem}</p>
                  <div className="text-[11px] text-cyan-300 font-medium">
                    <span className="text-slate-500 font-normal">Suggested Action: </span>
                    {r.suggested_action}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 text-xs">
              Run simulation to generate dynamic operational recommendations.
            </div>
          )}
        </div>
      </div>

      {/* Saved Scenarios Table */}
      <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white">Active Scenarios in Greenfield City</h2>
            <p className="text-xs text-slate-400">Baseline and What-If modified disaster plans.</p>
          </div>
          <Link to="/scenarios" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2.5">Scenario Name</th>
                <th className="pb-2.5">Disaster</th>
                <th className="pb-2.5">Severity</th>
                <th className="pb-2.5">Population</th>
                <th className="pb-2.5">Shelters</th>
                <th className="pb-2.5">Latest Clearance</th>
                <th className="pb-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {scenarios.map((scen) => (
                <tr key={scen.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 font-semibold text-white">
                    <Link to={`/simulation/${scen.id}`} className="hover:text-cyan-400">
                      {scen.name}
                    </Link>
                    <span className="block text-[11px] text-slate-500 font-normal truncate max-w-sm">
                      {scen.description}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{scen.disaster_type}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/30 text-cyan-300 border border-blue-800/40">
                      {scen.severity}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-300">{scen.population_size.toLocaleString()}</td>
                  <td className="py-3 font-mono text-slate-300">{scen.shelter_count}</td>
                  <td className="py-3 font-mono font-bold text-emerald-400">
                    {scen.latest_evacuation_rate != null ? `${scen.latest_evacuation_rate}%` : 'Not run'}
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/simulation/${scen.id}`}
                        className="px-2.5 py-1 rounded bg-blue-600/20 text-cyan-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition font-medium text-[11px]"
                      >
                        Simulation
                      </Link>
                      <Link
                        to={`/analytics/${scen.id}`}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-medium text-[11px]"
                      >
                        Analytics
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
