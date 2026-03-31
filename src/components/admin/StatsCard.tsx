import React from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    trendPositive?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, trendPositive }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
                {trend && (
                    <p className={`text-xs mt-2 font-medium ${trendPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {trendPositive ? '↑' : '↓'} {trend}
                    </p>
                )}
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                {icon}
            </div>
        </div>
    );
};

export default StatsCard;
