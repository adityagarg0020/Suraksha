import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Building,
  AlertTriangle,
  CheckCircle,
  Users,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { ScenarioListItem } from '../types/scenario';

export const ReportsPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const list = await api.getScenarios();
      setScenarios(list);
      if (list.length > 0) {
        // Fetch run for first scenario
        const run = await api.getLatestSimulationRun(list[0].id);
        setSelectedRunId(run.id);
        const rep = await api.getReportData(run.id);
        setReportData(rep);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScenario = async (scenId: string) => {
    setLoading(true);
    try {
      const run = await api.getLatestSimulationRun(scenId);
      setSelectedRunId(run.id);
      const rep = await api.getReportData(run.id);
      setReportData(rep);
    } catch (e) {
      console.error(e);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const metrics = reportData?.metrics;
  const bottlenecks = reportData?.bottlenecks || [];
  const recommendations = reportData?.recommendations || [];
  const assumptions = reportData?.assumptions_and_limitations || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header / Actions (Hidden during print) */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Formal Evacuation Simulation Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Export comprehensive documentation for emergency preparedness exercises.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {scenarios.length > 0 && (
            <select
              onChange={(e) => handleSelectScenario(e.target.value)}
              className="bg-navy-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {selectedRunId && (
            <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print View</span>
              </button>

              <a
                href={api.getReportCsvUrl(selectedRunId)}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </a>

              <a
                href={api.getReportPdfUrl(selectedRunId)}
                download
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Printable Report Document Card */}
      {reportData ? (
        <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-2xl space-y-8 text-xs text-slate-300 print:bg-white print:text-black print:p-0 print:border-none">
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-6 print:border-slate-300">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 block print:text-blue-600">
                  EVACUSAFE SIMULATION PLATFORM • FORMAL DRILL REPORT
                </span>
                <h2 className="text-2xl font-black text-white mt-1 print:text-black">
                  {reportData.scenario_name}
                </h2>
                <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                  {reportData.description}
                </p>
              </div>
              <div className="text-right font-mono text-[11px] text-slate-400 print:text-slate-600">
                <div>Run ID: {reportData.run_id.substring(0, 8)}...</div>
                <div>Generated: {new Date(reportData.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-800/80 print:border-slate-300">
              <div>
                <span className="text-slate-400 text-[10px] block print:text-slate-600">Disaster Category</span>
                <span className="font-bold text-white print:text-black">{reportData.disaster_type}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block print:text-slate-600">Severity Classification</span>
                <span className="font-bold text-cyan-300 print:text-blue-600">{reportData.severity}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block print:text-slate-600">Simulated Population</span>
                <span className="font-bold text-white font-mono print:text-black">{reportData.population_size} Persons</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block print:text-slate-600">Town Environment</span>
                <span className="font-bold text-white print:text-black">Greenfield City</span>
              </div>
            </div>
          </div>

          {/* Executive Summary Metrics */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 print:text-black">
              1. Executive Performance Metrics
            </h3>
            {metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 print:bg-slate-100 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 block print:text-slate-600">Clearance Rate</span>
                  <span className="text-lg font-black font-mono text-emerald-400 print:text-emerald-700">{metrics.evacuation_rate_pct}%</span>
                </div>
                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 print:bg-slate-100 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 block print:text-slate-600">Successfully Evacuated</span>
                  <span className="text-lg font-black font-mono text-white print:text-black">{metrics.successfully_evacuated} persons</span>
                </div>
                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 print:bg-slate-100 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 block print:text-slate-600">Average Clearance Time</span>
                  <span className="text-lg font-black font-mono text-cyan-300 print:text-blue-700">{metrics.avg_evacuation_time_min} minutes</span>
                </div>
                <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 print:bg-slate-100 print:border-slate-300">
                  <span className="text-[10px] text-slate-400 block print:text-slate-600">Unreachable Population</span>
                  <span className="text-lg font-black font-mono text-red-400 print:text-red-700">{metrics.unable_to_reach} persons</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottleneck Analysis Table */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 print:text-black">
              2. Bottleneck & Corridor Stress Analysis
            </h3>
            {bottlenecks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 print:border-slate-300">
                  <thead className="bg-navy-950 print:bg-slate-200">
                    <tr className="border-b border-slate-800 text-slate-400 print:border-slate-300 print:text-slate-700">
                      <th className="p-2.5">Corridor Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Simulated Demand</th>
                      <th className="p-2.5">Design Limit</th>
                      <th className="p-2.5">Stress Ratio</th>
                      <th className="p-2.5">Delay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                    {bottlenecks.map((b: any) => (
                      <tr key={b.road_id}>
                        <td className="p-2.5 font-medium text-white print:text-black">{b.road_name} ({b.road_id})</td>
                        <td className="p-2.5 font-bold text-amber-400 print:text-amber-700">{b.category}</td>
                        <td className="p-2.5 font-mono">{b.simulated_load} units</td>
                        <td className="p-2.5 font-mono">{b.configured_capacity} units</td>
                        <td className="p-2.5 font-mono font-bold text-amber-400 print:text-amber-700">{b.congestion_ratio}x</td>
                        <td className="p-2.5 font-mono">+{b.average_delay_seconds}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 italic">No corridors exceeded threshold capacity.</p>
            )}
          </div>

          {/* Rule-Based Recommendations */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 print:text-black">
              3. Operational Action Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.map((r: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-lg bg-navy-950 border border-slate-800 print:bg-slate-50 print:border-slate-300 space-y-1">
                  <div className="flex items-center justify-between font-bold text-white print:text-black">
                    <span>{r.title}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 print:bg-slate-200 print:text-blue-700">
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 print:text-slate-700">{r.problem}</p>
                  <div className="text-cyan-300 print:text-blue-800 font-medium">
                    <span className="text-slate-500 font-normal">Action: </span>
                    {r.suggested_action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Assumptions & Disclaimer */}
          <div className="pt-4 border-t border-slate-800 print:border-slate-300 space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider print:text-slate-800">
              4. Model Assumptions & Operational Limitations
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] print:text-slate-600">
              {assumptions.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center text-slate-500 text-xs">
          Select or run a simulation to generate printable reports.
        </div>
      )}
    </div>
  );
};
