import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Play,
  Copy,
  ArrowRight,
  Sliders,
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { ScenarioListItem, ComparisonResponse, ComparisonItem } from '../types/scenario';

export const ComparePage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadComparisonData();
  }, []);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const scenList = await api.getScenarios();
      setScenarios(scenList);

      // Collect latest run IDs from available scenarios
      const runIdsToCompare: string[] = [];
      for (const s of scenList.slice(0, 3)) {
        try {
          const run = await api.getLatestSimulationRun(s.id);
          runIdsToCompare.push(run.id);
        } catch {
          // No run for this scenario
        }
      }

      if (runIdsToCompare.length > 0) {
        setSelectedRunIds(runIdsToCompare);
        const comp = await api.compareSimulationRuns(runIdsToCompare);
        setComparison(comp);
      }
    } catch (e) {
      console.error('Error loading comparison data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateForWhatIf = async (scenarioId: string) => {
    setDuplicatingId(scenarioId);
    try {
      const duplicated = await api.duplicateScenario(scenarioId);
      navigate(`/scenarios/${duplicated.id}/edit`);
    } catch (err: any) {
      alert('Failed to duplicate scenario: ' + err.message);
    } finally {
      setDuplicatingId(null);
    }
  };

  const items = comparison?.items || [];

  // Chart data
  const chartData = items.map((it) => ({
    name: it.scenario_name.length > 18 ? it.scenario_name.substring(0, 16) + '...' : it.scenario_name,
    evac_rate: it.evacuation_rate_pct,
    avg_time: it.avg_evacuation_time_min,
    bottlenecks: it.bottleneck_count,
    score: it.score,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            Strategy Comparison & What-If Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate alternative evacuation strategies side-by-side using empirical performance criteria.
          </p>
        </div>

        {scenarios.length > 0 && (
          <button
            onClick={() => handleDuplicateForWhatIf(scenarios[0].id)}
            disabled={duplicatingId != null}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20"
          >
            <Copy className="w-4 h-4" />
            <span>Create What-If Branch</span>
          </button>
        )}
      </div>

      {/* Synthesis & Trade-Off Banner */}
      {comparison && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-navy-900 to-slate-900 border border-blue-800/40 shadow-xl text-xs space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
            <Sparkles className="w-4 h-4" />
            <span>Synthesized Strategy Trade-Off Analysis</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {comparison.trade_off_analysis}
          </p>
        </div>
      )}

      {/* Multi-Run KPI Comparison Matrix */}
      {items.length > 0 ? (
        <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <span className="font-bold text-white text-sm">Empirical Evaluation Matrix</span>
            <span className="text-xs text-slate-400">Green badges indicate best performing metric</span>
          </div>

          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3">Strategy / Scenario</th>
                <th className="pb-3">Disaster</th>
                <th className="pb-3 text-center">Clearance %</th>
                <th className="pb-3 text-center">Avg Time</th>
                <th className="pb-3 text-center">Bottlenecks</th>
                <th className="pb-3 text-center">Max Stress</th>
                <th className="pb-3 text-center">Shelter Util</th>
                <th className="pb-3 text-center">Overall Score</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((it) => {
                const isBestRate = it.run_id === comparison?.best_evacuation_rate_run_id;
                const isFastest = it.run_id === comparison?.fastest_evacuation_run_id;
                const isFewestB = it.run_id === comparison?.fewest_bottlenecks_run_id;

                return (
                  <tr key={it.run_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 font-bold text-white max-w-xs">
                      {it.scenario_name}
                      <span className="block font-normal text-[10px] text-slate-500 font-mono">
                        Run: {it.run_id.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-300">
                      {it.disaster_type} ({it.severity})
                    </td>

                    {/* Evacuation Rate */}
                    <td className="py-3.5 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          isBestRate ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-200'
                        }`}
                      >
                        {it.evacuation_rate_pct}%
                      </span>
                    </td>

                    {/* Avg Evacuation Time */}
                    <td className="py-3.5 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          isFastest ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-200'
                        }`}
                      >
                        {it.avg_evacuation_time_min}m
                      </span>
                    </td>

                    {/* Bottlenecks */}
                    <td className="py-3.5 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          isFewestB ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-amber-400'
                        }`}
                      >
                        {it.bottleneck_count}
                      </span>
                    </td>

                    {/* Max Congestion Ratio */}
                    <td className="py-3.5 text-center font-mono text-slate-300">
                      {it.max_congestion_ratio}x
                    </td>

                    {/* Shelter Util */}
                    <td className="py-3.5 text-center font-mono text-slate-300">
                      {it.shelter_utilization_pct}%
                    </td>

                    {/* Score */}
                    <td className="py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded bg-blue-900/30 text-cyan-300 border border-blue-700/50 font-mono font-black text-xs">
                        {it.score} / 100
                      </span>
                    </td>

                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/analytics/${it.run_id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px]"
                        >
                          Analytics
                        </Link>
                        <a
                          href={api.getReportPdfUrl(it.run_id)}
                          download
                          className="px-2.5 py-1 rounded bg-blue-600/20 text-cyan-400 hover:bg-blue-600 hover:text-white text-[11px]"
                        >
                          PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center bg-navy-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
          <GitCompare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <span>At least two simulation runs are needed to generate comparative analytics.</span>
        </div>
      )}

      {/* Comparative Charts Grid */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clearance Rate Comparison */}
          <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3">Evacuation Clearance Rate (%)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B1528', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
                  <Bar dataKey="evac_rate" name="Clearance %" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Clearance Time Comparison */}
          <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3">Average Evacuation Time (Minutes)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B1528', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
                  <Bar dataKey="avg_time" name="Avg Minutes" fill="#0284C7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
