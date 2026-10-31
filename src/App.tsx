
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TestSample from './pages/TestSample';
import Samples from './pages/Samples';
import Farmers from './pages/Farmers';
import FarmerDetail from './pages/FarmerDetail';
import HotspotMap from './pages/HotspotMap';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Protected application pages */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/test" element={<TestSample />} />
          <Route path="/samples" element={<Samples />} />
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/farmers/:id" element={<FarmerDetail />} />
          <Route path="/hotspots" element={<HotspotMap />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Unknown URLs */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
