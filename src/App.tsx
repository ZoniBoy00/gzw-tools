import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { DataProvider } from './lib/DataContext';
import AppShell from './components/layout/AppShell';
import './index.css';

const Dashboard = lazy(() => import('./components/Dashboard'));
const RepCalculator = lazy(() => import('./components/RepCalculator'));
const DollarCalculator = lazy(() => import('./components/DollarCalculator'));
const MissionFinder = lazy(() => import('./components/MissionFinder'));
const AmmoGuide = lazy(() => import('./components/AmmoGuide'));
const ArmorGuide = lazy(() => import('./components/ArmorGuide'));
const BackpackGuide = lazy(() => import('./components/BackpackGuide'));
const WeaponsGuide = lazy(() => import('./components/WeaponsGuide'));
const VendorGuide = lazy(() => import('./components/VendorGuide'));
const LoadoutBuilder = lazy(() => import('./components/LoadoutBuilder'));
const LogAnalyzer = lazy(() => import('./components/LogAnalyzer'));
const KeysGuide = lazy(() => import('./components/KeysGuide'));
const ApiDocs = lazy(() => import('./components/ApiDocs'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));

function RouteFallback() {
  return <div className="route-fallback" role="status"><span className="route-fallback__mark" /> Loading module…</div>;
}

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
          <Suspense fallback={<RouteFallback />}><AppRoutes /></Suspense>
        </AppShell>
      </DataProvider>
    </BrowserRouter>
  );
}
