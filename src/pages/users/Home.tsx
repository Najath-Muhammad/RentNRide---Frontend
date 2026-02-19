
import React, { useEffect } from 'react';
import Navbar from '../../components/user/Navbar'
import HeroSection from '../../components/home/HeroSection';
import VehicleGrid from '../../components/home/VehicleGrid';
import { useAuthStore } from '../../stores/authStore';
import { reverseGeocode } from '../../utils/locationiq';

const Home: React.FC = () => {
  const { location, setLocation, setCoordinates, coordinates } = useAuthStore();

  useEffect(() => {
    // Only auto-detect if location is the default 'India'
    if (location === 'India') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const data = await reverseGeocode(latitude, longitude);
              const address = data.display_name || `Near ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
              setLocation(address);
              setCoordinates({ lat: latitude, lon: longitude });
            } catch (err) {
              console.error('Auto-location detection failed:', err);
            }
          },
          (error) => {
            console.warn('Geolocation permission denied or error:', error.message);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
  }, [location, setLocation, setCoordinates]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <HeroSection />

      {coordinates ? (
        <>
          <VehicleGrid
            title="Right Next to You"
            initialRange={10}
            limit={4}
            showRangeSelector={false}
          />
          <VehicleGrid
            title="Exploring Nearby"
            initialRange={50}
            minRange={10}
            limit={4}
            showRangeSelector={false}
          />
          <VehicleGrid
            title="All Available Rides"
            minRange={50}
            showRangeSelector={true} // Allow user to play with the range here
          />
        </>
      ) : (
        <VehicleGrid title="Vehicles For You" />
      )}
    </div>
  );
};

export default Home;