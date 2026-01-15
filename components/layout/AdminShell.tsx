"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Workspace */}
        <main className="flex flex-col flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
