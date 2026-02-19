import { Link } from '@tanstack/react-router';
import { Home, Search, HelpCircle, ArrowRight } from 'lucide-react';

export default function UserNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-100 blur-3xl opacity-60"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-100 blur-3xl opacity-60"></div>

      <div className="text-center relative z-10 px-4 max-w-lg w-full">
        <div className="mb-6 relative inline-block">
          <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <span className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 relative z-10">
            404
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Off the Map
        </h1>

        <p className="text-lg text-gray-500 mb-10 leading-relaxed">
          We couldn't find the page you're looking for. It might have been moved or removed, or you might have taken a wrong turn.
        </p>

        <div className="space-y-4">
          <Link
            to="/"
            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Home className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Return Home</p>
                <p className="text-sm text-gray-500">Go back to the main dashboard</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/vehicles/search"
            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                <Search className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Find a Vehicle</p>
                <p className="text-sm text-gray-500">Browse available rentals</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </Link>

          <div className="pt-6 border-t border-gray-100 mt-6">
            <Link to="/about" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
              <HelpCircle className="w-4 h-4" />
              <span>Need help? Contact Support</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}