import React from 'react';

const LocationMap: React.FC<{ address: string }> = ({ address }) => {
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(address)}`;

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h2 className="text-2xl font-bold mb-6">Pickup & Location</h2>
      <p className="text-gray-700 mb-4">{address}</p>
      <div className="h-96 rounded-lg overflow-hidden border">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
};

export default LocationMap;
