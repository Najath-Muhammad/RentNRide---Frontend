import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, LogOut, Settings, Car, Loader2, Bell, MapPin, Navigation, Menu, X, Crown } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/authStore';
import { AuthApi } from '../../services/api/auth/login.api';
import { searchLocations, reverseGeocode, type LocationSuggestion } from "../../utils/locationiq"

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, location, setLocation, setCoordinates, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [locationInputValue, setLocationInputValue] = useState(location || 'India');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(location || 'India');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]); // Store full objects
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location) {
      setLocationInputValue(location);
      setSelectedLocation(location);
    } else {
      setLocationInputValue('India');
      setSelectedLocation('India');
    }
  }, [location]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setShowDropdown(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Debounced search for suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchLocations(query);
      setSuggestions(results);
    } catch (err) {
      console.error('Location search failed:', err);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(locationInputValue);
    }, 400); // debounce 400ms

    return () => clearTimeout(timer);
  }, [locationInputValue, fetchSuggestions]);

  // Handle current location detection
  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setShowDropdown(false);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const data = await reverseGeocode(latitude, longitude);

      const address = data.display_name || `Near ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      setSelectedLocation(address);
      setLocationInputValue(address);
      setLocation(address); // Persist to store
      setCoordinates({ lat: latitude, lon: longitude }); // Persist coords

      // Auto-navigate to search page if not already there or just to refresh
      navigate({ to: '/vehicles/search' });
    } catch (err) {
      console.error('Location detection failed:', err);
      const error = err as Error;
      alert(error.message || 'Unable to detect your location. Please try manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    const name = suggestion.display_name;
    setSelectedLocation(name);
    setLocationInputValue(name);
    setLocation(name); // Persist to store
    if (suggestion.lat && suggestion.lon) {
      setCoordinates({ lat: parseFloat(suggestion.lat), lon: parseFloat(suggestion.lon) });
    }
    setSuggestions([]);
    setShowDropdown(false);

    // Auto-navigate to search page
    navigate({ to: '/vehicles/search' });
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await AuthApi.logout();
      if (logout) logout();
      navigate({ to: '/auth/login' });
    } catch (error) {
      console.error('Logout failed:', error);
      if (logout) logout();
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
    <nav className="bg-white sticky top-0 z-50 shadow-card backdrop-blur-md bg-white/80 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-10">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate({ to: '/' })}>
              <h1 className="text-2xl font-bold tracking-tight text-blue-600">
                rentNride<span className="text-gray-900">.</span>
              </h1>
            </div>

            {/* Location Search Box */}
            <div className="hidden md:block relative w-80" ref={dropdownRef}>
              <div
                className="flex items-center bg-gray-50 rounded-full px-5 py-2.5 border border-gray-100 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all shadow-sm cursor-pointer"
                onClick={() => inputRef.current?.focus()}
              >
                <MapPin className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={selectedLocation || "Select your location..."}
                  value={locationInputValue}
                  onChange={(e) => setLocationInputValue(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-full font-medium"
                />
              </div>

              {showDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 max-h-80 overflow-y-auto">
                  {/* Use current location button */}
                  <button
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-blue-50 transition-colors border-b border-gray-100 text-left disabled:opacity-60"
                  >
                    {isDetecting ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                    ) : (
                      <Navigation className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-blue-600">
                        {isDetecting ? 'Detecting...' : 'Use current location'}
                      </p>
                      <p className="text-xs text-gray-500">Auto-detect your location</p>
                    </div>
                  </button>

                  {/* Suggestions list */}
                  {isSearching ? (
                    <div className="px-5 py-4 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                      <span className="text-sm text-gray-500">Searching...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((place, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(place)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-medium truncate">{place.display_name}</span>
                      </button>
                    ))
                  ) : locationInputValue.trim().length >= 2 ? (
                    <div className="px-5 py-4 text-center text-sm text-gray-500">
                      No locations found
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {isAuthenticated && (
              <div className="hidden lg:flex items-center gap-8">
                <button
                  onClick={() => navigate({ to: '/' })}
                  className={`${window.location.pathname === '/' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600 text-sm font-semibold transition-colors`}
                >
                  Home
                </button>
                <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                  Categories
                </button>
                <button
                  onClick={() => navigate({ to: '/vehicles/search' })}
                  className={`${window.location.pathname.includes('/vehicles/search') ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600 text-sm font-semibold transition-colors`}
                >
                  Vehicles
                </button>
                <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                  Contact
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-5">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {isAuthenticated && user ? (
              <>
                <button onClick={() => navigate({ to: '/vehicles/vehicle_listing' })} className="hidden sm:inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                  List your vehicle
                </button>

                <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-3">
                  <button className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-full transition-all relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>

                  <div className="relative group">
                    <button className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                      <span className="text-sm font-semibold text-gray-700 hidden lg:block mr-2">{getDisplayName()}</span>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
                        {getInitial() || <User className="w-4 h-4" />}
                      </div>
                    </button>
                    <div className="absolute right-0 mt-4 w-72 bg-white rounded-2xl shadow-soft border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                      <div className="p-2">
                        <div className="px-4 py-4 mb-2 bg-gray-50/50 rounded-xl">
                          <p className="text-sm font-bold text-gray-900">{getDisplayName()}</p>
                          <p className="text-xs text-gray-500 font-medium truncate">{user.email}</p>
                        </div>

                        <div className="space-y-1">
                          <button
                            onClick={() => navigate({ to: '/user/profile' })}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg w-full text-left transition-colors"
                          >
                            <User className="w-4 h-4" />
                            Profile
                          </button>
                          <button
                            onClick={() => navigate({ to: '/vehicles/my-vehicles' })}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg w-full text-left transition-colors"
                          >
                            <Car className="w-4 h-4" />
                            My Vehicles
                          </button>
                          <button
                            onClick={() => navigate({ to: '/user/my-bookings' })}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg w-full text-left transition-colors"
                          >
                            <Car className="w-4 h-4" />
                            My Bookings
                          </button>
                          <button
                            onClick={() => navigate({ to: '/user/subscription' })}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-600 rounded-lg w-full text-left transition-colors"
                          >
                            <Crown className="w-4 h-4 text-amber-500" />
                            My Subscription
                          </button>
                          {user.role === 'admin' && (
                            <button
                              onClick={() => navigate({ to: '/admin' })}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg w-full text-left transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                              Admin Dashboard
                            </button>
                          )}
                        </div>

                        <div className="h-px bg-gray-100 my-2"></div>

                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg w-full text-left transition-colors disabled:opacity-70"
                        >
                          {isLoggingOut ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                          {isLoggingOut ? 'Logging out...' : 'Log Out'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Guest User */
              <>
                <div className="hidden lg:flex items-center gap-8">
                  <button
                    onClick={() => navigate({ to: '/' })}
                    className={`${window.location.pathname === '/' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600 text-sm font-semibold transition-colors`}
                  >
                    Home
                  </button>
                  <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                    Categories
                  </button>
                  <button
                    onClick={() => navigate({ to: '/vehicles/search' })}
                    className={`${window.location.pathname.includes('/vehicles/search') ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600 text-sm font-semibold transition-colors`}
                  >
                    Vehicles
                  </button>
                  <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                    Contact
                  </button>
                </div>

                <div className="h-6 w-px bg-gray-200 mx-2 hidden lg:block"></div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate({ to: '/auth/login' })}
                    className="text-gray-700 hover:text-blue-600 text-sm font-semibold transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => navigate({ to: '/auth/signup' })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    Sign Up
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu (Slide-down panel) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-2">
            <button
              onClick={() => {
                navigate({ to: '/' });
                setIsMobileMenuOpen(false);
              }}
              className={`${window.location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                } w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 font-semibold transition-all`}
            >
              Home
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-700 w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 font-semibold transition-all"
            >
              Categories
            </button>
            <button
              onClick={() => {
                navigate({ to: '/vehicles/search' });
                setIsMobileMenuOpen(false);
              }}
              className={`${window.location.pathname.includes('/vehicles/search') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                } w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 font-semibold transition-all`}
            >
              Vehicles
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-700 w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 font-semibold transition-all"
            >
              Contact
            </button>

            {/* Authenticated user quick links in mobile menu */}
            {isAuthenticated && (
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <button
                  onClick={() => {
                    navigate({ to: '/user/profile' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-semibold transition-all"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    navigate({ to: '/vehicles/my-vehicles' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-semibold transition-all"
                >
                  <Car className="w-4 h-4" />
                  My Vehicles
                </button>
                <button
                  onClick={() => {
                    navigate({ to: '/user/my-bookings' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-semibold transition-all"
                >
                  <Car className="w-4 h-4" />
                  My Bookings
                </button>
                <button
                  onClick={() => {
                    navigate({ to: '/user/subscription' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-amber-600 hover:bg-amber-50 font-semibold transition-all"
                >
                  <Crown className="w-4 h-4" />
                  My Subscription
                </button>
              </div>
            )}

            {/* Show auth buttons on mobile if not authenticated */}
            {!isAuthenticated && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <button
                  onClick={() => {
                    navigate({ to: '/auth/login' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-gray-700 hover:text-blue-600 px-4 py-3 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all text-left"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    navigate({ to: '/auth/signup' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav >
  );
};

export default Navbar;