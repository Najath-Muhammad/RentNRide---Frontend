import React from 'react';
import HeroCarousel from './HeroCarousel';

const HeroSection: React.FC = () => {
  const scrollToExplore = () => {
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-gradient-to-b from-blue-50 to-white py-24 text-center overflow-hidden">
      <div className="container mx-auto px-4 max-w-5xl mb-16">
        <h1 className="text-4xl md:text-7xl font-bold text-gray-900 mb-8 tracking-tight leading-tight">
          Rent the ride you need,<br />
          <span className="text-blue-600">whenever you need it.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Premium vehicles, affordable prices, and seamless booking experience. Start your journey today.
        </p>
        <button
          onClick={scrollToExplore}
          className="bg-blue-600 text-white px-12 py-4 rounded-full text-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transform hover:-translate-y-1"
        >
          Explore Vehicles
        </button>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <HeroCarousel />
      </div>
    </section>
  );
};

export default HeroSection;