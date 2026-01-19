import React, { useState, useEffect, useRef } from 'react';
import { Search, User, LogOut, Settings, Car, Loader2, Bell, MapPin, Navigation } from 'lucide-react';

// Mock data for demonstration
const mockUser = {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user'
};

const mockLocations = [
  'Kalpetta, Kerala',
  'Kozhikode, Kerala',
  'Wayanad, Kerala',
  'Kannur, Kerala',
  'Kasaragod, Kerala',
  'Mananthavady, Kerala',
  'Sulthan Bathery, Kerala',
  'Mumbai, Maharashtra',
  'Delhi, Delhi',
  'Bangalore, Karnataka'
];

const Navbar = () => {
  const [isAuthenticated] = useState(true);
  const [user] = useState(mockUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState(mockLocations);
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (locationSearch) {
      const filtered = mockLocations.filter(location =>
        location.toLowerCase().includes(locationSearch.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(mockLocations);
    }
  }, [locationSearch]);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // In a real app, you would reverse geocode the coordinates
        // For now, we'll simulate it
        setTimeout(() => {
          setSelectedLocation('Kalpetta, Kerala');
          setLocationSearch('');
          setShowLocationDropdown(false);
          setIsDetectingLocation(false);
        }, 1000);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to detect your location. Please select manually.');
        setIsDetectingLocation(false);
      }
    );
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setLocationSearch('');
    setShowLocationDropdown(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsLoggingOut(false);
      alert('Logged out successfully');
    }, 1000);
  };

  const getInitial = () => {
    if (user?.name?.[0]) return user.name[0].toUpperCase();
    if (user?.email?.[0]) return user.email[0].toUpperCase();
    return '';
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/80 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-10">
            <div className="flex-shrink-0 cursor-pointer">
              <h1 className="text-2xl font-bold tracking-tight text-blue-600">
                rentNride<span className="text-gray-900">.</span>
              </h1>
            </div>

            {/* Location Search Box */}
            <div className="hidden md:block relative" ref={locationDropdownRef}>
              <div 
                className="flex items-center bg-gray-50 rounded-full px-5 py-2.5 w-80 border border-gray-100 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all shadow-sm cursor-pointer"
                onClick={() => setShowLocationDropdown(true)}
              >
                <MapPin className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder={selectedLocation || "Select your location..."}
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  onFocus={() => setShowLocationDropdown(true)}
                  className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 w-full font-medium"
                />
              </div>

              {/* Location Dropdown */}
              {showLocationDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  {/* Detect Current Location Button */}
                  <button
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-blue-50 transition-colors border-b border-gray-100 text-left"
                  >
                    {isDetectingLocation ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                    ) : (
                      <Navigation className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-blue-600">
                        {isDetectingLocation ? 'Detecting...' : 'Use current location'}
                      </p>
                      <p className="text-xs text-gray-500">Auto-detect your location</p>
                    </div>
                  </button>

                  {/* Location List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((location, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSelect(location)}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 font-medium">{location}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-5 py-4 text-center">
                        <p className="text-sm text-gray-500">No locations found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <div className="hidden lg:flex items-center gap-8">
                <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                  Home
                </button>
                <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                  Categories
                </button>
                <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                  Vehicles
                </button>
                <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                  Contact
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-5">
            {isAuthenticated && user ? (
              <>
                <button className="hidden sm:inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
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
                    <div className="absolute right-0 mt-4 w-72 bg-white rounded-2xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                      <div className="p-2">
                        <div className="px-4 py-4 mb-2 bg-gray-50/50 rounded-xl">
                          <p className="text-sm font-bold text-gray-900">{getDisplayName()}</p>
                          <p className="text-xs text-gray-500 font-medium truncate">{user.email}</p>
                        </div>

                        <div className="space-y-1">
                          <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg w-full text-left transition-colors">
                            <User className="w-4 h-4" />
                            Profile
                          </button>
                          <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg w-full text-left transition-colors">
                            <Car className="w-4 h-4" />
                            My Vehicles
                          </button>
                          <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg w-full text-left transition-colors">
                            <Car className="w-4 h-4" />
                            My Bookings
                          </button>
                          {user.role === 'admin' && (
                            <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg w-full text-left transition-colors">
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
              <>
                <div className="hidden lg:flex items-center gap-8">
                  <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                    Home
                  </button>
                  <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                    Categories
                  </button>
                  <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                    Vehicles
                  </button>
                  <button className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">
                    Contact
                  </button>
                </div>

                <div className="h-6 w-px bg-gray-200 mx-2 hidden lg:block"></div>

                <div className="flex items-center gap-4">
                  <button className="text-gray-700 hover:text-blue-600 text-sm font-semibold transition-colors">
                    Log In
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                    Sign Up
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;