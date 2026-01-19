import React from 'react';

const CustomerReviews: React.FC = () => {
  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
      <div className="flex items-center mb-4">
        <span className="text-4xl font-bold">4.5</span>
        <div className="ml-4">
          <div className="flex text-yellow-400">★★★★★</div>
          <p className="text-sm text-gray-600">Based on 128 reviews</p>
        </div>
      </div>
      <div className="space-y-3">
        {['Cleanliness', 'Comfort', 'Performance', 'Value for Money'].map((item) => (
          <div key={item}>
            <div className="flex justify-between text-sm">
              <span>{item}</span>
              <span>4.6</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerReviews;