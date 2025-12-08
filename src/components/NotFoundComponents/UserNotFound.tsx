
import { Link } from '@tanstack/react-router';

export default function UserNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="mb-8">
          <span className="text-9xl font-extrabold text-indigo-200">404</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-800 mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-600 mb-10 max-w-lg mx-auto">
          Looks like this page took a vacation. Don't worry — your dashboard is still here!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-10 rounded-xl shadow-lg transform hover:scale-105 transition-all"
          >
            Back to Home
          </Link>
        
        </div>
      </div>
    </div>
  );
}