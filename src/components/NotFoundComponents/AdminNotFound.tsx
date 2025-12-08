
import { Link } from '@tanstack/react-router';

export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-red-500 opacity-20 select-none">404</h1>
        <h2 className="text-5xl font-bold mt-8 mb-4">Access Denied or Page Missing</h2>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          This admin route does not exist. Even admins can't access what isn't there.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center mt-12">
          <Link
            to="/admin/dashboard"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-12 rounded-lg shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-16 text-sm text-gray-500">
          <p>You're logged in as <span className="text-red-400 font-bold">Administrator</span></p>
        </div>
      </div>
    </div>
  );
}