import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, LogOut, Settings, Car, Loader2, Bell, MapPin, Navigation, Menu, X, Crown, MessageCircle, Wallet } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/authStore';
import { AuthApi } from '../../services/api/auth/login.api';
import { searchLocations, reverseGeocode, type LocationSuggestion } from "../../utils/locationiq";
import { NotificationApi } from '../../services/api/notification/notification.api';
import type { INotification } from '../../services/api/notification/notification.api';

const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return "just now";
};

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
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
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
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

  // Notifications logic
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await NotificationApi.getNotifications();
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const handleFcmMessage = () => fetchNotifications();
    window.addEventListener("fcm:message", handleFcmMessage);
    return () => {
      window.removeEventListener("fcm:message", handleFcmMessage);
    };
  }, [fetchNotifications]);

  const handleReadNotification = async (notif: INotification) => {
    try {
      if (!notif.isRead) {
        await NotificationApi.markAsRead(notif._id);
        fetchNotifications();
      }
      setShowNotifications(false);

      // Navigate based on type
      if (notif.type === 'chat') {
        navigate({ to: '/user/chat' });
      } else if (notif.type === 'booking') {
        navigate({ to: '/user/my-bookings' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await NotificationApi.deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

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
          {/* ── LEFT: Logo + Location ───────────────────────────────────── */}
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate({ to: '/' })}>
              <h1 className="text-2xl font-bold tracking-tight text-blue-600">
                rentNride<span className="text-gray-900">.</span>
              </h1>
            </div>

            {/* Location Search Box */}
            <div className="hidden md:block relative w-72" ref={dropdownRef}>
              <div
                className="flex items-center bg-gray-50 rounded-full px-4 py-2.5 border border-gray-100 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all shadow-sm cursor-pointer"
                onClick={() => inputRef.current?.focus()}
              >
                <MapPin className="w-4 h-4 text-blue-600 mr-2.5 flex-shrink-0" />
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
          </div>

          {/* ── CENTER: Nav links (authenticated) ───────────────────────── */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-7">
              <button
                onClick={() => navigate({ to: '/' })}
                className={`${window.location.pathname === '/' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600 text-sm font-semibold transition-colors`}
              >
                Home
              </button>
              <button
                onClick={() => navigate({ to: '/vehicles/search' })}
                className={`${window.location.pathname.includes('/vehicles/search') ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600 text-sm font-semibold transition-colors`}
              >
                Vehicles
              </button>
              <button
                onClick={() => navigate({ to: '/contact' })}
                className={`${window.location.pathname === '/contact' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600 text-sm font-semibold transition-colors`}
              >
                Contact
              </button>
            </div>
          )}

          {/* ── RIGHT: Actions + Avatar ──────────────────────────────────── */}
          <div className="flex items-center gap-3">
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
                <button
                  onClick={() => navigate({ to: '/vehicles/vehicle_listing' })}
                  className="hidden sm:inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  List your vehicle
                </button>

                <div className="h-7 w-px bg-gray-200 hidden sm:block" />

                {/* Icon buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate({ to: '/user/wallet' })}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-full transition-all"
                    title="Wallet"
                  >
                    <Wallet className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => navigate({ to: '/user/chat' })}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-full transition-all"
                    title="Messages"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>

                  <div className="relative" ref={notificationRef}>
                    <button
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-full transition-all relative"
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-2xl shadow-soft border border-gray-100 opacity-100 transition-all z-50 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                          <h3 className="font-bold text-gray-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>

                        <div className="max-h-[24rem] overflow-y-auto">
                          {notifications.filter(n => !n.isRead).length > 0 ? (
                            notifications.filter(n => !n.isRead).map((notif) => (
                              <div
                                key={notif._id}
                                onClick={() => handleReadNotification(notif)}
                                className="flex items-start gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors bg-blue-50/30"
                              >
                                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {notif.title}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                    {notif.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1.5 font-medium">
                                    {timeAgo(notif.createdAt)}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => handleDeleteNotification(e, notif._id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center flex flex-col items-center">
                              <Bell className="w-8 h-8 text-gray-300 mb-2" />
                              <p className="text-sm text-gray-500 font-medium">You're all caught up!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar + Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                    <span className="text-sm font-semibold text-gray-700 hidden lg:block mr-1">{getDisplayName()}</span>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">
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
                          onClick={() => navigate({ to: '/user/chat' })}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg w-full text-left transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Messages
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

                      <div className="h-px bg-gray-100 my-2" />

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
              </>
            ) : (
              /* Guest User */
              <>
                <div className="hidden lg:flex items-center gap-7">
                  <button
                    onClick={() => navigate({ to: '/' })}
                    className={`${window.location.pathname === '/' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600 text-sm font-semibold transition-colors`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => navigate({ to: '/vehicles/search' })}
                    className={`${window.location.pathname.includes('/vehicles/search') ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600 text-sm font-semibold transition-colors`}
                  >
                    Vehicles
                  </button>
                  <button
                    onClick={() => navigate({ to: '/contact' })}
                    className={`${window.location.pathname === '/contact' ? 'text-blue-600' : 'text-gray-600'} hover:text-blue-600 text-sm font-semibold transition-colors`}
                  >
                    Contact
                  </button>
                </div>

                <div className="h-6 w-px bg-gray-200 mx-1 hidden lg:block" />

                <div className="hidden md:flex items-center gap-3">
                  <button
                    onClick={() => navigate({ to: '/auth/login' })}
                    className="text-gray-700 hover:text-blue-600 text-sm font-semibold transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => navigate({ to: '/auth/signup' })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
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
              onClick={() => {
                navigate({ to: '/contact' });
                setIsMobileMenuOpen(false);
              }}
              className={`${window.location.pathname === '/contact' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                } w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 font-semibold transition-all`}
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
                    navigate({ to: '/user/chat' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-semibold transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Messages
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