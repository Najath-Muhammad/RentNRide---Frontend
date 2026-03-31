import React from 'react';

interface RecentBooking {
    _id: string;
    userName: string;
    vehicleName: string;
    date: string;
    status: string;
    paymentStatus: string;
}

interface TableProps {
    bookings: RecentBooking[];
}

export const RecentBookingsTable: React.FC<TableProps> = ({ bookings }) => {
    if (bookings.length === 0) {
        return (
            <div className="bg-white p-8 text-center rounded-2xl shadow-sm border border-gray-100 mt-8">
                <p className="text-gray-500 font-medium">No recent bookings to display.</p>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-8 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Recent Activities</h3>
                <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    View All
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vehicle</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bookings.map((booking, _index) => (
                            <tr key={booking._id || _index} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-gray-900">{booking.userName || 'Guest User'}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-medium">{booking.vehicleName}</td>
                                <td className="px-6 py-4 text-gray-600">{new Date(booking.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.paymentStatus === 'paid' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {booking.paymentStatus}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
