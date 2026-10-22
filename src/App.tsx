import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';

// Dashboard pages pull in Recharts / Leaflet, so load them on demand.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TestSample = lazy(() => import('./pages/TestSample'));
const Samples = lazy(() => import('./pages/Samples'));
const Farmers = lazy(() => import('./pages/Farmers'));
const FarmerDetail = lazy(() => import('./pages/FarmerDetail'));
const HotspotMap = lazy(() => import('./pages/HotspotMap'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/test" element={<TestSample />} />
          <Route path="/samples" element={<Samples />} />
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/farmers/:id" element={<FarmerDetail />} />
          <Route path="/map" element={<HotspotMap />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

