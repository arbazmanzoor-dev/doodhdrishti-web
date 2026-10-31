
import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

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

export function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">

      {/* Sidebar */}
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">

        {/* Topbar */}
        <Topbar onMenuClick={() => setOpen(true)} />

        {/* Page content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">

          {/* Load route content on demand */}
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>

        </main>
      </div>
    </div>
  );
}

export default AppLayout;
