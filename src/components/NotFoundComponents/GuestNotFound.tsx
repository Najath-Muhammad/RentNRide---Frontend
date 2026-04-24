import { Link } from '@tanstack/react-router';
import { Compass, LogIn, ChevronRight } from 'lucide-react';

export default function GuestNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {}
      <div className="absolute top-1/4 left-0 w-full h-1/2 -skew-y-6 bg-gradient-to-r from-blue-50 to-indigo-50 z-0 transform origin-left opacity-60"></div>
      <div className="text-center relative z-10 p-6 max-w-lg w-full">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center rotate-6 transform transition-transform hover:rotate-0">
              <Compass className="w-12 h-12 text-blue-600" />
            </div>
            <div className="absolute top-[-10px] right-[-10px] w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-white shadow-lg animate-bounce">
              ?
            </div>
          </div>
        </div>

        <h1 className="text-8xl font-black text-gray-900 mb-2 tracking-tighter">
          404
        </h1>

        <h2 className="text-2xl font-bold text-gray-600 mb-8 uppercase tracking-wide">
          Page Not Found
        </h2>

        <p className="text-lg text-gray-500 mb-10">
          You seem to be lost. To access our premium fleet and features, please log in or return to the homepage.
        </p>

        <div className="grid gap-4 w-full max-w-xs mx-auto">
          <Link
            to="/auth/login"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Login to Account
          </Link>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 px-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md active:scale-95 group"
          >
            Go Home
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-400">
          Looking for a ride? <Link to="/auth/signup" className="text-blue-600 font-bold hover:underline">Join us today</Link>
        </div>
      </div>
    </div>
  );
}