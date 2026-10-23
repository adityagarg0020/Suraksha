import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  FastForward,
  Shield,
  Activity,
  AlertTriangle,
  Users,
  Building,
  CheckCircle,
  Clock,
  Sparkles,
  BarChart3,
  Layers,
  FileText
} from 'lucide-react';
import { GreenfieldMap } from '../components/GreenfieldMap';
import { api } from '../services/api';
import {
  Scenario,
  SimulationRun,
  MapData,
  SimulationStepSnapshot,
  TimelineEvent,
  Bottleneck
} from '../types/scenario';

export const SimulationWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [simulationRun, setSimulationRun] = useState<SimulationRun | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x, 10x
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    loadScenarioAndDrill();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const loadScenarioAndDrill = async () => {
    setIsLoading(true);
    try {
      // 1. Load scenario list or target scenario
      let targetId = id;
      if (!targetId || targetId === 'default') {
        const list = await api.getScenarios();
        if (list.length > 0) targetId = list[0].id;
      }

      if (targetId) {
        const [scen, map] = await Promise.all([
          api.getScenario(targetId),
          api.getScenarioMap(targetId),
        ]);
        setScenario(scen);
        setMapData(map);

        // Fetch latest run if exists
        try {
          const run = await api.getLatestSimulationRun(targetId);
          setSimulationRun(run);
          setCurrentStepIndex(run.step_snapshots.length > 0 ? run.step_snapshots.length - 1 : 0);
        } catch {
          // No run yet, user can click "Start Simulation"
        }
      }
    } catch (e) {
      console.error('Error loading simulation workspace:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Run full simulation engine on backend
  const handleRunFreshSimulation = async () => {
    if (!scenario) return;
    setIsSimulating(true);
    setIsPlaying(false);
    try {
      const run = await api.runSimulation(scenario.id, {
        random_seed: 42,
        max_steps: 100,
        step_time_seconds: 30,
      });
      setSimulationRun(run);
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } catch (err) {
      alert('Simulation execution failed: ' + err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Playback loop
  useEffect(() => {
    if (isPlaying && simulationRun && simulationRun.step_snapshots.length > 0) {
      const intervalMs = Math.max(100, Math.floor(1000 / playbackSpeed));
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= simulationRun.step_snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, simulationRun]);

  const handleStepForward = () => {
    if (!simulationRun) return;
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(simulationRun.step_snapshots.length - 1, prev + 1));
  };

  const handleResetPlayback = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const currentSnapshot: SimulationStepSnapshot | undefined =
    simulationRun?.step_snapshots[currentStepIndex];

  const filteredEvents: TimelineEvent[] = (simulationRun?.timeline_events || []).filter((e) => {
    if (selectedEventFilter === 'alerts') return e.severity === 'danger' || e.severity === 'warning';
    if (selectedEventFilter === 'shelter') return e.event_type.includes('SHELTER');
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Mission Control Bar */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">
              {scenario ? scenario.name : 'Simulation Workspace'}
            </h1>
            {scenario && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-blue-700/40 uppercase">
                {scenario.disaster_type} • {scenario.severity}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Greenfield City road network • Population: {scenario?.population_size.toLocaleString() || 600} agents
          </p>
        </div>

        {/* Playback Controls & Speed */}
        <div className="flex flex-wrap items-center gap-2 bg-navy-950 px-3 py-1.5 rounded-lg border border-slate-800">
          {/* Run/Recompute Engine */}
          <button
            onClick={handleRunFreshSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition disabled:opacity-50"
            title="Execute graph simulation engine"
          >
            <Activity className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Computing...' : 'Run Simulation'}</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!simulationRun}
            className={`p-2 rounded text-xs font-semibold transition ${
              isPlaying
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            } disabled:opacity-40`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          {/* Step Forward */}
          <button
            onClick={handleStepForward}
            disabled={!simulationRun || isPlaying}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-40"
            title="Step Forward (1 frame)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={handleResetPlayback}
            disabled={!simulationRun}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-40"
            title="Reset to step 0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <span className="text-slate-700">|</span>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-xs">
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded text-xs font-mono font-bold transition ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <span className="text-slate-700">|</span>

          {/* Simulated Time & Step Indicator */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-300 pl-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              T+{currentSnapshot ? currentSnapshot.simulated_time_min.toFixed(1) : '0.0'} min
            </span>
            <span className="text-slate-500">
              (Step {currentSnapshot ? currentSnapshot.step : 0}/{simulationRun?.total_steps || 0})
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Config, Center Map, Right Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Parameters & Closures */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Drill Parameters
              </span>
              <Link to={`/scenarios/${scenario?.id}/edit`} className="text-cyan-400 hover:underline">
                Edit
              </Link>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Population:</span>
                <span className="font-mono font-bold text-white">{scenario?.population_size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Blocked Roads:</span>
                <span className="font-mono font-bold text-red-400">{scenario?.blocked_roads.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Speed Multiplier:</span>
                <span className="font-mono text-cyan-300">{scenario?.speed_multiplier}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capacity Multiplier:</span>
                <span className="font-mono text-cyan-300">{scenario?.capacity_multiplier}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Staggered Evac:</span>
                <span>{scenario?.staggered_evacuation ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-slate-400 block mb-1 font-semibold text-[11px]">Active Road Closures:</span>
              <div className="flex flex-wrap gap-1">
                {scenario?.blocked_roads && scenario.blocked_roads.length > 0 ? (
                  scenario.blocked_roads.map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800 font-mono text-[10px]">
                      {r} (Closed)
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[11px]">No roads closed.</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Analytics Nav Link */}
          {simulationRun && (
            <Link
              to={`/analytics/${scenario?.id}`}
              className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-800/40 text-cyan-300 text-xs font-semibold hover:border-cyan-500 transition shadow-lg group"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>View Full Analytics Dashboard</span>
              </div>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          )}

          {/* Active Bottlenecks List */}
          <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl text-xs">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] block pb-2 mb-2 border-b border-slate-800">
              Identified Choke Points
            </span>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {simulationRun?.bottlenecks && simulationRun.bottlenecks.length > 0 ? (
                simulationRun.bottlenecks.map((b) => (
                  <div key={b.road_id} className="p-2 rounded bg-slate-900/70 border border-slate-800">
                    <div className="flex justify-between font-semibold text-slate-200">
                      <span>{b.road_name}</span>
                      <span className="text-amber-400 font-mono font-bold">{b.congestion_ratio}x</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px] mt-0.5">
                      <span>Load: {b.simulated_load} / {b.configured_capacity}</span>
                      <span>Delay: +{b.average_delay_seconds}s</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center py-4">
                  No critical bottlenecks logged yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Greenfield City Interactive Map */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          {mapData ? (
            <GreenfieldMap
              nodes={mapData.nodes}
              edges={mapData.edges}
              shelters={mapData.shelters}
              hazardZone={mapData.hazard_zone}
              blockedRoads={scenario?.blocked_roads || []}
              agents={currentSnapshot?.sample_agents || []}
              roadCongestion={currentSnapshot?.road_congestion || {}}
              activeBottlenecks={currentSnapshot?.active_bottlenecks || []}
              shelterOccupancies={currentSnapshot?.shelter_occupancy || {}}
              height="580px"
            />
          ) : (
            <div className="h-[580px] rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
              Loading Greenfield City Road Network...
            </div>
          )}

          {/* Interactive Timeline Scrubbing Slider */}
          {simulationRun && simulationRun.step_snapshots.length > 0 && (
            <div className="p-3 bg-navy-900/90 border border-slate-800 rounded-xl flex items-center gap-4 text-xs">
              <span className="text-slate-400 font-mono font-medium whitespace-nowrap">Timeline Scrub:</span>
              <input
                type="range"
                min="0"
                max={simulationRun.step_snapshots.length - 1}
                value={currentStepIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentStepIndex(parseInt(e.target.value));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="font-mono text-cyan-300 whitespace-nowrap">
                Step {currentSnapshot?.step} (T+{currentSnapshot?.simulated_time_min}m)
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Live Metrics & Shelter Capacity */}
        <div className="lg:col-span-3 space-y-4">
          {/* Live Progress Gauges */}
          <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl text-xs space-y-3">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] block pb-2 border-b border-slate-800">
              Live Evacuation Status
            </span>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="text-slate-400">Evacuation Rate:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {currentSnapshot ? `${currentSnapshot.evacuation_pct}%` : '0%'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${currentSnapshot?.evacuation_pct || 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">In Transit</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">
                    {currentSnapshot?.moving_count || 0}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Safely Arrived</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {currentSnapshot?.evacuated_count || 0}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Awaiting Dispatch</span>
                  <span className="font-mono font-bold text-slate-300 text-sm">
                    {currentSnapshot?.waiting_count || 0}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Unreachable</span>
                  <span className="font-mono font-bold text-red-400 text-sm">
                    {currentSnapshot?.unreachable_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Shelter Occupancies */}
          <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl text-xs space-y-3">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] block pb-2 border-b border-slate-800">
              Shelter Capacities & Load
            </span>

            <div className="space-y-2.5">
              {mapData?.shelters.map((sh) => {
                const occ = currentSnapshot?.shelter_occupancy[sh.id] ?? sh.assigned_population;
                const cap = sh.capacity;
                const pct = Math.min(100, Math.round((occ / Math.max(1, cap)) * 100));
                const isFull = pct >= 100;

                return (
                  <div key={sh.id} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-medium text-slate-200">{sh.name}</span>
                      <span className="font-mono text-slate-400">
                        {occ} / {cap} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isFull ? 'bg-red-500' : (pct >= 80 ? 'bg-amber-400' : 'bg-emerald-400')
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Event Log */}
          <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800 shadow-xl text-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Event Log
              </span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setSelectedEventFilter('all')}
                  className={`px-1.5 py-0.5 rounded ${selectedEventFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedEventFilter('alerts')}
                  className={`px-1.5 py-0.5 rounded ${selectedEventFilter === 'alerts' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                >
                  Alerts
                </button>
                <button
                  onClick={() => setSelectedEventFilter('shelter')}
                  className={`px-1.5 py-0.5 rounded ${selectedEventFilter === 'shelter' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                >
                  Shelters
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredEvents.map((ev, i) => (
                <div
                  key={i}
                  className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80 text-[11px] flex items-start gap-1.5"
                >
                  <span className="font-mono text-cyan-400 shrink-0 text-[10px]">T+{ev.time_min}m</span>
                  <span className="text-slate-300 leading-tight">{ev.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
