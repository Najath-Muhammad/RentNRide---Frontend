import React from 'react';

interface LegalSafetyProps {
  vehicle: {
    rcExpiryDate?: string;
    insuranceExpiryDate?: string;
  };
}

const LegalSafety: React.FC<LegalSafetyProps> = ({ vehicle }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const rcExpiry = formatDate(vehicle.rcExpiryDate);
  const insuranceExpiry = formatDate(vehicle.insuranceExpiryDate);

  const isRCValid = vehicle.rcExpiryDate ? new Date(vehicle.rcExpiryDate) > new Date() : false;
  const isInsuranceValid = vehicle.insuranceExpiryDate ? new Date(vehicle.insuranceExpiryDate) > new Date() : false;

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h2 className="text-2xl font-bold mb-6">Legal & Safety</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p className="text-sm text-gray-500 mb-1">RC Validity</p>
          <div className="flex items-center gap-3">
            <p className={`text-lg font-medium ${isRCValid ? 'text-green-600' : 'text-red-600'}`}>
              {isRCValid ? 'Valid' : 'Expired'}
            </p>
            <span className="text-gray-400">•</span>
            <p className="text-lg text-gray-900">{rcExpiry}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Insurance Status</p>
          <div className="flex items-center gap-3">
            <p className={`text-lg font-medium ${isInsuranceValid ? 'text-green-600' : 'text-red-600'}`}>
              {isInsuranceValid ? 'Insured' : 'Not Insured'}
            </p>
            <span className="text-gray-400">•</span>
            <p className="text-lg text-gray-900">{insuranceExpiry}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalSafety;