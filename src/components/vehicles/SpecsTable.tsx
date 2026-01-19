import React from 'react';

interface Vehicle {
  brand: string;
  modelName: string;
  category: string;
  fuelType: string;
  seatingCapacity: number;
  doors?: number | null; 
}

interface SpecsTableProps {
  vehicle: Vehicle;
}

const SpecsTable: React.FC<SpecsTableProps> = ({ vehicle }) => {
  const specs = [
    { label: 'Brand', value: vehicle.brand },
    { label: 'Model', value: vehicle.modelName },
    { label: 'Category', value: vehicle.category },
    { label: 'Fuel Type', value: vehicle.fuelType },
    { label: 'Seating Capacity', value: `${vehicle.seatingCapacity} seats` },
    { label: 'Doors', value: vehicle.doors ?? 'N/A' },
  ];

  return (
    <div className="grid grid-cols-2 gap-8">
      {specs.map((spec) => (
        <div key={spec.label}>
          <p className="text-sm text-gray-500">{spec.label}</p>
          <p className="text-lg font-medium text-gray-900">
            {spec.value ?? 'N/A'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default SpecsTable;