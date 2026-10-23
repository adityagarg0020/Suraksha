import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Shield,
  Layers,
  Users,
  Building,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  Play,
  X,
  Sliders,
  Car
} from 'lucide-react';
import { GreenfieldMap } from '../components/GreenfieldMap';
import { api } from '../services/api';
import { MapData, RoadEdge, Shelter } from '../types/scenario';

export const ScenarioBuilderPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('Greenfield City — Flash Flood & Bridge Closure Drill');
  const [description, setDescription] = useState<string>('Hypothetical flash flood impacting lowlands and central river crossings. Evaluates rerouting capacity via northern ridge and eastern bypass.');
  const [townName, setTownName] = useState<string>('Greenfield City');
  const [disasterType, setDisasterType] = useState<string>('Flood');
  const [severity, setSeverity] = useState<string>('High');
  const [populationSize, setPopulationSize] = useState<number>(600);
  const [notes, setNotes] = useState<string>('Simulated exercise for municipal evacuation testing.');

  // Step 2: Hazards & Roads
  const [blockedRoads, setBlockedRoads] = useState<string[]>(['R-10', 'R-1']);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [capacityMultiplier, setCapacityMultiplier] = useState<number>(1.0);
  const [staggeredEvacuation, setStaggeredEvacuation] = useState<boolean>(false);
  const [allowOverflow, setAllowOverflow] = useState<boolean>(false);

  // Step 3: Mobility Mix
  const [mobilityStandard, setMobilityStandard] = useState<number>(70);
  const [mobilitySlow, setMobilitySlow] = useState<number>(20);
  const [mobilityFast, setMobilityFast] = useState<number>(10);

  // Step 4: Shelters
  const [sheltersList, setSheltersList] = useState<Shelter[]>([]);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      const defaultMap = await api.getDefaultMap();
      setMapData(defaultMap);
      setSheltersList(defaultMap.shelters);

      if (isEditing && id) {
        const existing = await api.getScenario(id);
        setName(existing.name);
        setDescription(existing.description || '');
        setTownName(existing.town_name);
        setDisasterType(existing.disaster_type);
        setSeverity(existing.severity);
        setPopulationSize(existing.population_size);
        setBlockedRoads(existing.blocked_roads || []);
        setSpeedMultiplier(existing.speed_multiplier || 1.0);
        setCapacityMultiplier(existing.capacity_multiplier || 1.0);
        setStaggeredEvacuation(existing.staggered_evacuation || false);
        setAllowOverflow(existing.allow_shelter_overflow || false);
        setNotes(existing.notes || '');

        if (existing.shelters && existing.shelters.length > 0) {
          setSheltersList(existing.shelters);
        }
      }
    } catch (e) {
      console.error('Error loading scenario builder data:', e);
    }
  };

  const toggleRoadClosure = (roadId: string) => {
    setBlockedRoads((prev) =>
      prev.includes(roadId) ? prev.filter((r) => r !== roadId) : [...prev, roadId]
    );
  };

  const handleShelterCapacityChange = (shelterId: string, newCap: number) => {
    setSheltersList((prev) =>
      prev.map((s) => (s.id === shelterId ? { ...s, capacity: Math.max(10, newCap) } : s))
    );
  };

  const handleShelterAvailabilityToggle = (shelterId: string) => {
    setSheltersList((prev) =>
      prev.map((s) => (s.id === shelterId ? { ...s, availability: !s.availability } : s))
    );
  };

  const handleSaveScenario = async (andRun: boolean = false) => {
    if (!name.trim()) {
      alert('Please enter a valid scenario name.');
      return;
    }
    if (populationSize <= 0) {
      alert('Population size must be greater than zero.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        description,
        town_name: townName,
        disaster_type: disasterType,
        severity,
        population_size: populationSize,
        blocked_roads: blockedRoads,
        speed_multiplier: speedMultiplier,
        capacity_multiplier: capacityMultiplier,
        staggered_evacuation: staggeredEvacuation,
        allow_shelter_overflow: allowOverflow,
        notes,
        mobility_mix: {
          standard: mobilityStandard / 100,
          slow: mobilitySlow / 100,
          fast: mobilityFast / 100,
        },
      };

      let savedScenario;
      if (isEditing && id) {
        savedScenario = await api.updateScenario(id, payload);
      } else {
        savedScenario = await api.createScenario(payload);
      }

      if (andRun) {
        await api.runSimulation(savedScenario.id);
        navigate(`/simulation/${savedScenario.id}`);
      } else {
        navigate(`/scenarios`);
      }
    } catch (err: any) {
      alert('Failed to save scenario: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Details', icon: Shield },
    { num: 2, title: 'Hazards & Roads', icon: Layers },
    { num: 3, title: 'Population', icon: Users },
    { num: 4, title: 'Shelters', icon: Building },
    { num: 5, title: 'Review & Save', icon: CheckCircle },
  ];

  const totalShelterCap = sheltersList.filter((s) => s.availability).reduce((acc, s) => acc + s.capacity, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
          <div>
            <h1 className="text-xl font-black text-white">
              {isEditing ? 'Edit Disaster Scenario' : 'Scenario Builder Wizard'}
            </h1>
            <p className="text-xs text-slate-400">
              Configure hypothetical disaster drill parameters, road closures, and shelter capacities.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded bg-slate-800 text-cyan-400 border border-slate-700">
            Step {currentStep} of 5
          </span>
        </div>

        {/* Stepper Dots */}
        <div className="grid grid-cols-5 gap-2">
          {stepsList.map((st) => {
            const isDone = currentStep > st.num;
            const isCurr = currentStep === st.num;
            return (
              <button
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold transition text-left ${
                  isCurr
                    ? 'bg-blue-600/30 text-cyan-300 border border-blue-500/50'
                    : isDone
                    ? 'bg-slate-800/60 text-emerald-400 border border-emerald-800/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <st.icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">{st.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-xl p-6 shadow-xl text-xs space-y-6">
        {/* Step 1: Scenario Details */}
        {currentStep === 1 && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-base font-bold text-white mb-2">Step 1: Emergency Scenario Identity</h2>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Scenario Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
                placeholder="e.g. Greenfield City — Severe River Inundation"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Disaster Classification</label>
                <select
                  value={disasterType}
                  onChange={(e) => setDisasterType(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
                >
                  <option value="Flood">Flood (River Inundation)</option>
                  <option value="Fire">Wildfire / Industrial Conflagration</option>
                  <option value="Earthquake">Earthquake / Infrastructure Collapse</option>
                  <option value="Custom">Custom Emergency Exercise</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Severity Parameter</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
                >
                  <option value="Low">Low (Advisory Precaution)</option>
                  <option value="Moderate">Moderate (Localized Impact)</option>
                  <option value="High">High (Mandatory Order)</option>
                  <option value="Critical">Critical (Immediate Catastrophic)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Scenario Operational Summary</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
                placeholder="Describe scenario conditions, bridge impacts, and expected challenges..."
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Total Simulated Population: {populationSize} agents</label>
              <input
                type="range"
                min="100"
                max="2500"
                step="50"
                value={populationSize}
                onChange={(e) => setPopulationSize(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <span className="text-slate-500 text-[11px]">Supports up to 2,500 discrete agents for local desktop simulation.</span>
            </div>
          </div>
        )}

        {/* Step 2: Hazards & Road Network Closures */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
              <div>
                <h2 className="text-base font-bold text-white">Step 2: Road Network Closures & Hazards</h2>
                <p className="text-slate-400 text-xs">
                  Click on roads on the map or select checkboxes below to close roads affected by hazard waters.
                </p>
              </div>
              <span className="text-xs font-mono text-red-400 bg-red-950/60 px-3 py-1 rounded border border-red-900">
                {blockedRoads.length} Road(s) Blocked
              </span>
            </div>

            {/* Interactive Map for road toggling */}
            {mapData && (
              <div className="rounded-xl overflow-hidden border border-slate-800">
                <GreenfieldMap
                  nodes={mapData.nodes}
                  edges={mapData.edges}
                  shelters={sheltersList}
                  hazardZone={mapData.hazard_zone}
                  blockedRoads={blockedRoads}
                  height="360px"
                  onRoadClick={(r) => toggleRoadClosure(r.id)}
                />
              </div>
            )}

            {/* Road Checkbox Grid */}
            <div>
              <span className="font-semibold text-slate-300 block mb-2">Road Closure Toggles:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-navy-950 rounded-lg border border-slate-800">
                {mapData?.edges.map((e) => {
                  const isBlocked = blockedRoads.includes(e.id);
                  return (
                    <label
                      key={e.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer border text-xs transition ${
                        isBlocked
                          ? 'bg-red-950/50 border-red-700 text-red-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isBlocked}
                        onChange={() => toggleRoadClosure(e.id)}
                        className="rounded bg-slate-800 border-slate-700 text-red-600 focus:ring-0"
                      />
                      <span className="font-medium truncate">{e.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Speed & Capacity Adjustments */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Speed Factor: {speedMultiplier}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Road Capacity Factor: {capacityMultiplier}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={capacityMultiplier}
                  onChange={(e) => setCapacityMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={staggeredEvacuation}
                    onChange={(e) => setStaggeredEvacuation(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Staggered Zone Departures</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Population & Mobility */}
        {currentStep === 3 && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Step 3: Synthetic Population Mobility Mix</h2>
              <p className="text-slate-400 text-xs">
                Configure synthetic demographic speed classes across the virtual population.
              </p>
            </div>

            <div className="space-y-4 bg-navy-950 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Standard Evacuees (1.0x Speed):</span>
                  <span className="font-mono font-bold text-cyan-400">{mobilityStandard}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={mobilityStandard}
                  onChange={(e) => setMobilityStandard(parseInt(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Mobility-Limited / Slower Groups (0.65x Speed):</span>
                  <span className="font-mono font-bold text-amber-400">{mobilitySlow}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={mobilitySlow}
                  onChange={(e) => setMobilitySlow(parseInt(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Vehicular / Express Clearance (1.35x Speed):</span>
                  <span className="font-mono font-bold text-emerald-400">{mobilityFast}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={mobilityFast}
                  onChange={(e) => setMobilityFast(parseInt(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-400 text-[11px]">
              <b>Note:</b> Virtual agents are distributed across residential zones (West Riverside, Hillside Estates, Oak Valley, Sunset Heights, Pinehurst, and Old River Town) based on residential density weights.
            </div>
          </div>
        )}

        {/* Step 4: Shelter Capacities & Availability */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
              <div>
                <h2 className="text-base font-bold text-white">Step 4: Shelter Capacities & Quotas</h2>
                <p className="text-slate-400 text-xs">
                  Set capacity limits and operational readiness for each Greenfield safe haven.
                </p>
              </div>
              <div className={`px-3 py-1 rounded text-xs font-mono font-bold border ${totalShelterCap >= populationSize ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-red-950/60 text-red-300 border-red-800'}`}>
                Total Capacity: {totalShelterCap} / {populationSize} Needed
              </div>
            </div>

            {totalShelterCap < populationSize && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>
                  Warning: Configured active shelter capacity ({totalShelterCap}) is less than simulated population ({populationSize}). Some agents will be unable to reach safety unless capacity is increased.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sheltersList.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{s.name}</span>
                    <button
                      onClick={() => handleShelterAvailabilityToggle(s.id)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                        s.availability
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {s.availability ? 'OPERATIONAL' : 'OFFLINE'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs mb-1">
                      Bed Capacity: <span className="font-bold text-white font-mono">{s.capacity}</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="400"
                      step="10"
                      value={s.capacity}
                      disabled={!s.availability}
                      onChange={(e) => handleShelterCapacityChange(s.id, parseInt(e.target.value))}
                      className="w-full accent-cyan-400 disabled:opacity-40"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 italic">{s.notes || 'Safe municipal reception facility.'}</p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={allowOverflow}
                  onChange={(e) => setAllowOverflow(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span className="font-medium text-xs">Allow Experimental Shelter Overflow (Ignore Strict Physical Ceilings)</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Review & Save */}
        {currentStep === 5 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Step 5: Review & Verification</h2>
              <p className="text-slate-400 text-xs">
                Verify scenario inputs prior to persistence and simulation execution.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-navy-950 border border-slate-800 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-slate-400 text-[11px] block">Scenario</span>
                  <span className="font-bold text-white text-xs">{name}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Disaster / Severity</span>
                  <span className="font-bold text-cyan-300 text-xs">{disasterType} • {severity}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Population</span>
                  <span className="font-bold text-white font-mono text-xs">{populationSize} agents</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Total Shelter Beds</span>
                  <span className="font-bold text-emerald-400 font-mono text-xs">{totalShelterCap} beds</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block mb-1">Road Closures:</span>
                <span className="font-mono text-xs text-red-400">
                  {blockedRoads.length > 0 ? blockedRoads.join(', ') : 'None'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block mb-1">Mobility Breakdown:</span>
                <span className="text-xs text-slate-300">
                  {mobilityStandard}% Standard • {mobilitySlow}% Slower/Mobility-limited • {mobilityFast}% Vehicular
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-30 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSaveScenario(false)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Scenario</span>
                </button>

                <button
                  onClick={() => handleSaveScenario(true)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Save & Run Simulation</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
