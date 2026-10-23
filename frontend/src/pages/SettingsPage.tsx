import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Activity,
  RefreshCw,
  AlertTriangle,
  Server,
  Cpu,
  Database,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [defaultSpeed, setDefaultSpeed] = useState<number>(1);
  const [congestionThreshold, setCongestionThreshold] = useState<number>(1.0);
  const [randomSeed, setRandomSeed] = useState<number>(42);

  useEffect(() => {
    api.checkHealth().then(setHealthStatus).catch(() => setHealthStatus({ status: 'offline' }));
  }, []);

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all scenarios, shelters, and simulation records to default Greenfield City demonstration drill?')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDemo();
      alert('Database successfully reset to official Greenfield City demonstration drill.');
      window.location.reload();
    } catch (e: any) {
      alert('Failed to reset: ' + e.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          System Settings & Model Assumptions
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Simulation engine calibration, backend diagnostics, and mandatory civil protection disclaimers.
        </p>
      </div>

      {/* Backend Diagnostics Card */}
      <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          Backend Runtime & Engine Diagnostics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
            <span className="text-slate-400 block mb-0.5">FastAPI Health</span>
            <div className="flex items-center gap-1.5 font-bold font-mono">
              <span className={`w-2 h-2 rounded-full ${healthStatus?.status === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className={healthStatus?.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}>
                {healthStatus?.status === 'healthy' ? 'ONLINE (PORT 8000)' : 'DISCONNECTED'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Graph Network Engine</span>
            <span className="font-bold text-white font-mono">NetworkX 3.2+ (Dijkstra)</span>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-slate-800">
            <span className="text-slate-400 block mb-0.5">Database Persistence</span>
            <span className="font-bold text-white font-mono">SQLite (SQLAlchemy ORM)</span>
          </div>
        </div>
      </div>

      {/* Engine Calibration Preferences */}
      <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl space-y-4 text-xs">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Engine Configuration Defaults
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Congestion Detection Threshold: {congestionThreshold}x Capacity
            </label>
            <input
              type="range"
              min="0.75"
              max="1.50"
              step="0.05"
              value={congestionThreshold}
              onChange={(e) => setCongestionThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <span className="text-slate-500 text-[11px]">
              Roads exceeding this traffic ratio trigger yellow/red bottleneck flags.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Default Deterministic Seed: {randomSeed}
            </label>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(parseInt(e.target.value))}
              className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
            />
            <span className="text-slate-500 text-[11px]">
              Ensures repeatable and fair multi-strategy comparison drills.
            </span>
          </div>
        </div>
      </div>

      {/* Database Maintenance & Demo Reset */}
      <div className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl space-y-3 text-xs">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          Demonstration Environment Reset
        </h2>
        <p className="text-slate-400 leading-relaxed">
          Restore the official baseline Greenfield City flood drill scenario, pre-computed simulation results, and default shelter capacities.
        </p>

        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset to Official Demo Drill'}</span>
        </button>
      </div>

      {/* Model Assumptions and Disclaimers (Section 28) */}
      <div className="p-6 rounded-xl bg-navy-950 border border-slate-800 shadow-xl space-y-3 text-xs text-slate-300">
        <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Model Assumptions and Mandatory Planning Limitations</span>
        </div>

        <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-xs leading-relaxed">
          <li><b>Synthetic Population:</b> All virtual agents represent simulated individuals or vehicle units with configurable movement speeds.</li>
          <li><b>Mathematical Network:</b> Road capacities, travel times, and congestion delays follow calibrated discrete-time BPR density functions.</li>
          <li><b>Shelter Allocation:</b> Safe haven capacities represent physical urban planning quotas; agents dynamically reroute when capacities are met.</li>
          <li><b>Software-Only Platform:</b> No physical sensors, live CCTV, GPS tracking of real persons, IoT devices, or drones are utilized.</li>
          <li><b>Planning Decision Support:</b> EvacuSafe is strictly designed for training exercises, municipal drills, and preparedness research. Simulation outcomes depend upon model input assumptions and do not replace certified emergency management protocols.</li>
        </ul>
      </div>
    </div>
  );
};
