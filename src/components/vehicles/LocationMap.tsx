import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface LocationMapProps {
  address: string;
  location?: {
    type: string;
    coordinates: number[]
  };
}

const LocationMap: React.FC<LocationMapProps> = ({ address, location }) => {
  const hasCoords = location?.coordinates && location.coordinates.length === 2;
  const [lon, lat] = hasCoords ? location!.coordinates : [0, 0];

  const mapUrl = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lon}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const externalMapUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-indigo-600" />
            Pickup & Location
          </h2>
          <p className="text-gray-500 mt-1 max-w-md">{address}</p>
        </div>
        <a
          href={externalMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium border border-gray-200"
        >
          View on Google Maps
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="relative group">
        <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'grayscale(0.1) contrast(1.1)' }}
            allowFullScreen
            loading="lazy"
            title="Vehicle Location"
          ></iframe>
        </div>
        <div className="absolute inset-0 pointer-events-none rounded-2xl border border-black/5 ring-1 ring-inset ring-black/5" />
      </div>

      <div className="mt-6 flex items-start gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <MapPin className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-indigo-900">Exact pickup location</h4>
          <p className="text-xs text-indigo-700 mt-0.5">
            The exact location will be provided after the booking is confirmed by the owner.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;
