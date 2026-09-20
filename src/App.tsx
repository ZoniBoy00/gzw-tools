import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './lib/DataContext';
import AppShell from './components/layout/AppShell';
import Dashboard from './components/Dashboard';
import RepCalculator from './components/RepCalculator';
import DollarCalculator from './components/DollarCalculator';
import MissionFinder from './components/MissionFinder';
import AmmoGuide from './components/AmmoGuide';
import ArmorGuide from './components/ArmorGuide';
import BackpackGuide from './components/BackpackGuide';
import WeaponsGuide from './components/WeaponsGuide';
import VendorGuide from './components/VendorGuide';
import LoadoutBuilder from './components/LoadoutBuilder';
import LogAnalyzer from './components/LogAnalyzer';
import KeysGuide from './components/KeysGuide';
import ApiDocs from './components/ApiDocs';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import './index.css';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/rep" element={<RepCalculator />} />
      <Route path="/dollar" element={<DollarCalculator />} />
      <Route path="/missions" element={<MissionFinder />} />
      <Route path="/ammo" element={<AmmoGuide />} />
      <Route path="/weapons" element={<WeaponsGuide />} />
      <Route path="/armor" element={<ArmorGuide />} />
      <Route path="/backpacks" element={<BackpackGuide />} />
      <Route path="/vendors" element={<VendorGuide />} />
      <Route path="/loadouts" element={<LoadoutBuilder />} />
      <Route path="/logs" element={<LogAnalyzer />} />
      <Route path="/api-docs" element={<ApiDocs />} />
      <Route path="/keys" element={<KeysGuide />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/tos" element={<TermsOfService />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </DataProvider>
    </BrowserRouter>
  );
}
