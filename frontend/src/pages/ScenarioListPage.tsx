import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Play,
  Copy,
  Edit2,
  Trash2,
  BarChart3,
  RefreshCw,
  Clock,
  Users,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { ScenarioListItem } from '../types/scenario';

export const ScenarioListPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const data = await api.getScenarios();
      setScenarios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (scenarioId: string) => {
    setActionInProgress(scenarioId);
    try {
      await api.duplicateScenario(scenarioId);
      await loadScenarios();
    } catch (err: any) {
      alert('Failed to duplicate scenario: ' + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (scenarioId: string) => {
    if (scenarios.length <= 1) {
      alert('Cannot delete the last remaining scenario. Keep at least one demonstration drill.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this scenario and all associated runs?')) {
      return;
    }
    setActionInProgress(scenarioId);
    try {
      await api.deleteScenario(scenarioId);
      await loadScenarios();
    } catch (err: any) {
      alert('Failed to delete scenario: ' + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRunDrill = async (scenarioId: string) => {
    setActionInProgress(scenarioId);
    try {
      await api.runSimulation(scenarioId);
      navigate(`/simulation/${scenarioId}`);
    } catch (err: any) {
      alert('Failed to execute simulation: ' + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            Saved Disaster Scenarios
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persisted disaster drills, baseline models, and What-If modified operational plans.
          </p>
        </div>

        <Link
          to="/scenarios/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Scenario</span>
        </Link>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {scenarios.map((scen) => (
          <div
            key={scen.id}
            className="p-5 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-base hover:text-cyan-400 transition">
                    <Link to={`/simulation/${scen.id}`}>{scen.name}</Link>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                    Town: {scen.town_name} • Created: {new Date(scen.created_at).toLocaleDateString()}
                  </span>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-900/40 text-cyan-300 border border-blue-700/50">
                  {scen.disaster_type} • {scen.severity}
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                {scen.description || 'Configured disaster evacuation exercise.'}
              </p>

              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-navy-950 border border-slate-800 text-[11px] mb-4">
                <div>
                  <span className="text-slate-500 block">Population</span>
                  <span className="font-mono font-bold text-slate-200">{scen.population_size}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Shelters</span>
                  <span className="font-mono font-bold text-slate-200">{scen.shelter_count}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Clearance</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {scen.latest_evacuation_rate != null ? `${scen.latest_evacuation_rate}%` : 'Not run'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleRunDrill(scen.id)}
                  disabled={actionInProgress === scen.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                  title="Run simulation"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run</span>
                </button>

                <button
                  onClick={() => handleDuplicate(scen.id)}
                  disabled={actionInProgress === scen.id}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Duplicate for What-If"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <Link
                  to={`/scenarios/${scen.id}/edit`}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Edit Scenario"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => handleDelete(scen.id)}
                  disabled={actionInProgress === scen.id}
                  className="p-1.5 rounded bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-500 transition"
                  title="Delete Scenario"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <Link
                to={`/simulation/${scen.id}`}
                className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
