import React, { useState } from 'react';
import { Search, User, LogOut, Settings, Car, Loader2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../utils/axios';
import { APIAuthRoutes } from '../../constants/route.constant';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  console.log('is user there',user)
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {

      await api.post(APIAuthRoutes.LOGOUT, {}, { withCredentials: true });


      setUser(null);

      navigate({ to: '/auth/login' });
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      navigate({ to: '/auth/login' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitial = (): string => {
    if (user?.name?.[0]) return user.name[0].toUpperCase();
    if (user?.email?.[0]) return user.email[0].toUpperCase();
    return '';
  };

  const getDisplayName = (): string => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">rentNride</h1>
            </div>

            <div className="hidden md:flex items-center bg-gray-50 rounded-lg px-4 py-2 w-80">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search vehicles by location..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <button className="text-gray-700 hover:text-gray-900 text-sm font-medium transition">
              Home
            </button>
            <button className="text-gray-700 hover:text-gray-900 text-sm font-medium transition">
              Vehicles
            </button>
            <button className="text-gray-700 hover:text-gray-900 text-sm font-medium transition">
              About
            </button>
            <button className="text-gray-700 hover:text-gray-900 text-sm font-medium transition">
              Contact
            </button>

            {/* Authenticated User */}
            {isAuthenticated && user ? (
              <div className="relative group">
                <button className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {getInitial() || <User className="w-5 h-5" />}
                  </div>
                  <span className="text-sm font-medium hidden lg:block">
                    {getDisplayName()}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-3">
                  <button
                      onClick={() => navigate({ to: '/' })}
                      className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => navigate({ to: '/' })}
                      className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition"
                    >
                      <Car className="w-4 h-4" />
                      My Bookings
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => navigate({ to: '/admin' })}
                        className="flex items-center gap-3 px-5 py-3 text-sm text-purple-600 hover:bg-purple-50 w-full text-left font-medium transition"
                      >
                        <Settings className="w-4 h-4" />
                        Admin Dashboard
                      </button>
                    )}
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left transition disabled:opacity-70"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Guest User */
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate({ to: '/auth/login' })}
                  className="text-gray-700 hover:text-gray-900 text-sm font-medium transition"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate({ to: '/auth/signup' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition shadow-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;