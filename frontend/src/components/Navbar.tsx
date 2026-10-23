import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Activity,
  RefreshCw,
  AlertOctagon,
  ChevronDown,
  Menu,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { ScenarioListItem } from '../types/scenario';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeScenarioId?: string;
  onScenarioChange?: (scenarioId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activeScenarioId,
  onScenarioChange,
}) => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadScenarios();
    checkHealth();
  }, []);

  const loadScenarios = async () => {
    try {
      const data = await api.getScenarios();
      setScenarios(data);
      if (!activeScenarioId && data.length > 0 && onScenarioChange) {
        onScenarioChange(data[0].id);
      }
    } catch (e) {
      console.error(e);
      setBackendHealthy(false);
    }
  };

  const checkHealth = async () => {
    try {
      await api.checkHealth();
      setBackendHealthy(true);
    } catch {
      setBackendHealthy(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm("Reset all scenarios and simulation runs to Greenfield City demonstration defaults?")) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDemo();
      await loadScenarios();
      window.location.reload();
    } catch (err) {
      alert("Failed to reset demo: " + err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-navy-950/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu & Logo */}
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-blue to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                EvacuSafe
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-700/50">
                EOC Platform
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:block">
              Simulate Today. Save Lives Tomorrow.
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Simulated Environment Banner */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/70 text-[11px] text-slate-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-slate-200">ENVIRONMENT:</span>
        <span className="text-cyan-300 font-mono">GREENFIELD CITY (SYNTHETIC)</span>
      </div>

      {/* Right: Scenario Switcher & Actions */}
      <div className="flex items-center gap-3">
        {scenarios.length > 0 && (
          <div className="relative">
            <select
              value={activeScenarioId || ''}
              onChange={(e) => onScenarioChange?.(e.target.value)}
              className="bg-navy-900 text-slate-200 text-xs rounded-lg border border-slate-700 px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.disaster_type})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        )}

        {/* Reset Demo Button */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
          title="Reset to official Greenfield City demo drill"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-cyan-400' : ''}`} />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>

        {/* Backend Connectivity Status */}
        <div
          className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border ${
            backendHealthy
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
              : 'bg-red-950/40 text-red-300 border-red-800/40'
          }`}
          title={backendHealthy ? "Simulation Engine Connected" : "Backend Disconnected"}
        >
          {backendHealthy ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">API Online</span>
            </>
          ) : (
            <>
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
