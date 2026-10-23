import {
  Scenario,
  ScenarioListItem,
  Shelter,
  SimulationRun,
  MapData,
  ComparisonResponse
} from '../types/scenario';

const API_BASE = '/api';

export const api = {
  // Scenarios
  async getScenarios(): Promise<ScenarioListItem[]> {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (!res.ok) throw new Error(`Failed to fetch scenarios: ${res.statusText}`);
    return res.json();
  },

  async getScenario(id: string): Promise<Scenario> {
    const res = await fetch(`${API_BASE}/scenarios/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch scenario: ${res.statusText}`);
    return res.json();
  },

  async createScenario(data: Partial<Scenario>): Promise<Scenario> {
    const res = await fetch(`${API_BASE}/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to create scenario: ${res.statusText}`);
    }
    return res.json();
  },

  async updateScenario(id: string, data: Partial<Scenario>): Promise<Scenario> {
    const res = await fetch(`${API_BASE}/scenarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to update scenario: ${res.statusText}`);
    }
    return res.json();
  },

  async deleteScenario(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/scenarios/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete scenario: ${res.statusText}`);
  },

  async duplicateScenario(id: string): Promise<Scenario> {
    const res = await fetch(`${API_BASE}/scenarios/${id}/duplicate`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to duplicate scenario: ${res.statusText}`);
    return res.json();
  },

  async resetDemo(): Promise<void> {
    const res = await fetch(`${API_BASE}/scenarios/reset-demo`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to reset demo: ${res.statusText}`);
  },

  // Shelters
  async getShelters(scenarioId: string): Promise<Shelter[]> {
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/shelters`);
    if (!res.ok) throw new Error(`Failed to fetch shelters: ${res.statusText}`);
    return res.json();
  },

  async createShelter(scenarioId: string, data: Partial<Shelter>): Promise<Shelter> {
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/shelters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to create shelter: ${res.statusText}`);
    }
    return res.json();
  },

  async updateShelter(shelterId: string, data: Partial<Shelter>): Promise<Shelter> {
    const res = await fetch(`${API_BASE}/shelters/${shelterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to update shelter: ${res.statusText}`);
    }
    return res.json();
  },

  async deleteShelter(shelterId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/shelters/${shelterId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to delete shelter: ${res.statusText}`);
    }
  },

  // Simulation
  async runSimulation(scenarioId: string, config?: { random_seed?: number; max_steps?: number; step_time_seconds?: number }): Promise<SimulationRun> {
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Simulation run failed: ${res.statusText}`);
    }
    return res.json();
  },

  async getSimulationRun(runId: string): Promise<SimulationRun> {
    const res = await fetch(`${API_BASE}/simulations/${runId}`);
    if (!res.ok) throw new Error(`Failed to fetch simulation run: ${res.statusText}`);
    return res.json();
  },

  async getLatestSimulationRun(scenarioId: string): Promise<SimulationRun> {
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/latest-run`);
    if (!res.ok) throw new Error(`No recent simulation run found: ${res.statusText}`);
    return res.json();
  },

  async getSimulationAnalytics(runId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulations/${runId}/analytics`);
    if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.statusText}`);
    return res.json();
  },

  async compareSimulationRuns(runIds: string[]): Promise<ComparisonResponse> {
    const res = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run_ids: runIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Comparison failed: ${res.statusText}`);
    }
    return res.json();
  },

  // Map
  async getDefaultMap(): Promise<MapData> {
    const res = await fetch(`${API_BASE}/map/default`);
    if (!res.ok) throw new Error(`Failed to fetch default map: ${res.statusText}`);
    return res.json();
  },

  async getScenarioMap(scenarioId: string): Promise<MapData> {
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/map`);
    if (!res.ok) throw new Error(`Failed to fetch scenario map: ${res.statusText}`);
    return res.json();
  },

  // Reports
  async getReportData(runId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulations/${runId}/report`);
    if (!res.ok) throw new Error(`Failed to fetch report data: ${res.statusText}`);
    return res.json();
  },

  getReportCsvUrl(runId: string): string {
    return `${API_BASE}/simulations/${runId}/report.csv`;
  },

  getReportPdfUrl(runId: string): string {
    return `${API_BASE}/simulations/${runId}/report.pdf`;
  },

  // AI Explanation
  async getAIExplanation(runId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulations/${runId}/ai-explain`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to generate explanation: ${res.statusText}`);
    return res.json();
  },

  async checkHealth(): Promise<{ status: string; fictional_town: string }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  }
};
