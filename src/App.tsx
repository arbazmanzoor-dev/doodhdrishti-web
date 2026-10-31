
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Lazy-loaded pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TestSample = lazy(() => import('./pages/TestSample'));
const Samples = lazy(() => import('./pages/Samples'));
const Farmers = lazy(() => import('./pages/Farmers'));
const FarmerDetail = lazy(() => import('./pages/FarmerDetail'));
const HotspotMap = lazy(() => import('./pages/HotspotMap'));
const Settings = lazy(() => import('./pages/Settings'));

// Loading spinner
function Spinner() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>

        {/* Public pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />

        {/* Protected application pages */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/test" element={<TestSample />} />
            <Route path="/samples" element={<Samples />} />
            <Route path="/farmers" element={<Farmers />} />
            <Route path="/farmers/:id" element={<FarmerDetail />} />
            <Route path="/hotspots" element={<HotspotMap />} />
            {/* Old address of the map page, kept so bookmarks and shared links still work */}
            <Route path="/map" element={<Navigate to="/hotspots" replace />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Suspense>
  );
}
