import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import EmailStudio from './pages/EmailStudio.jsx';
import SchoolFinder from './pages/SchoolFinder.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-ink text-paper">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/email" element={<EmailStudio />} />
          <Route path="/finder" element={<SchoolFinder />} />
          <Route path="/remotion" element={<Navigate to="/email" replace />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
