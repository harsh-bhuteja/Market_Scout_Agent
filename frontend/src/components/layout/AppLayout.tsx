import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#0B101A] text-[#F8FAFC] relative overflow-x-hidden">
      {/* Subtle ambient lighting */}
      <div className="fixed top-0 right-1/4 w-[600px] h-[500px] bg-amber-500/[0.02] rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/3 w-[500px] h-[400px] bg-blue-500/[0.02] rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
