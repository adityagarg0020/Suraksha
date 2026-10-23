import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScenarioListPage } from './pages/ScenarioListPage';
import { ScenarioBuilderPage } from './pages/ScenarioBuilderPage';
import { SimulationWorkspacePage } from './pages/SimulationWorkspacePage';
import { ShelterManagementPage } from './pages/ShelterManagementPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ComparePage } from './pages/ComparePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('');
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeScenarioId={activeScenarioId}
        onScenarioChange={setActiveScenarioId}
      />

      <div className="flex-1 flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeScenarioId={activeScenarioId}
        />

        <main className="flex-1 lg:ml-64 p-4 lg:p-8 min-h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/scenarios" element={<ScenarioListPage />} />
          <Route path="/scenarios/new" element={<ScenarioBuilderPage />} />
          <Route path="/scenarios/:id/edit" element={<ScenarioBuilderPage />} />
          <Route path="/simulation/:id" element={<SimulationWorkspacePage />} />
          <Route path="/shelters" element={<ShelterManagementPage />} />
          <Route path="/analytics/:id" element={<AnalyticsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
