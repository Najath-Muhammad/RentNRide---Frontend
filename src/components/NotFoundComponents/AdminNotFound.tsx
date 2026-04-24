import { Link } from '@tanstack/react-router';
import { ShieldAlert, LayoutDashboard, ChevronLeft } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white relative overflow-hidden">
      {}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>
      <div className="text-center relative z-10 p-8 max-w-2xl w-full">
        <div className="mb-6 flex justify-center">
          <div className="h-24 w-24 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20 shadow-2xl shadow-red-900/20 animate-pulse">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 opacity-20 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none">
          404
        </h1>

        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-300 bg-clip-text text-transparent">
          Restricted Area
        </h2>

        <p className="text-lg text-gray-400 mb-10 leading-relaxed">
          The requested admin resource cannot be found or you do not have permission to access it.
          Please verifying the URL or return to the safety of the dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/admin/dashboard"
            className="group flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-red-900/30 transition-all active:scale-95"
          >
            <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Admin Dashboard
          </Link>

          <Link
            to=".."
            className="group flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3.5 px-8 rounded-xl border border-gray-700 transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Link>
        </div>

        <div className="mt-16 flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-800/50 py-2 px-4 rounded-full inline-flex border border-gray-700/50">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p>System Status: <span className="text-gray-300 font-medium">Operational</span></p>
        </div>
      </div>
    </div>
  );
}