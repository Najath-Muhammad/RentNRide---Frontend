import React, { useEffect, useState } from 'react';
import { Users, Car, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { AdminDashboardApi, type DashboardStats } from '../../services/api/admin/dashboard.api';
import StatsCard from '../../components/admin/StatsCard';
import { DashboardCharts } from '../../components/admin/DashboardCharts';
import { RecentBookingsTable } from '../../components/admin/RecentBookingsTable';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const params: { startDate?: string; endDate?: string } = {};
                if (dateRange.startDate) params.startDate = dateRange.startDate;
                if (dateRange.endDate) params.endDate = dateRange.endDate;

                const res = await AdminDashboardApi.getDashboardStats(params);
                if (res.success) {
                    setStats(res.data);
                } else {
                    setError('Failed to load dashboard statistics.');
                }
            } catch (err: unknown) {
                console.error('Error loading dashboard stats:', err);
                const axiosError = err as { response?: { data?: { message?: string } } };
                setError(axiosError?.response?.data?.message || 'Failed to load dashboard statistics.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [dateRange]);

    if (loading && !stats) {
        return (
            <div className="flex-1 bg-gray-50 p-8 min-h-screen">
                <div className="animate-pulse space-y-8">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-24 bg-white rounded-xl shadow-sm border border-gray-100"></div>
                        ))}
                    </div>
                    <div className="h-64 bg-white rounded-xl shadow-sm border border-gray-100"></div>
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="flex-1 bg-gray-50 p-8 min-h-screen flex items-center justify-center">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 text-center max-w-lg">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
                    <p className="text-gray-600 font-medium mb-6">{error || 'Unknown error occurred.'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                    >
                        Retry Request
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="bg-gray-50 min-h-screen flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                        <p className="text-gray-500 text-sm font-medium mt-1">Welcome back. Here's what's happening today.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-gray-500 uppercase px-1">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="px-3 py-1.5 border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                            />
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold text-gray-500 uppercase px-1">End Date</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="px-3 py-1.5 border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none cursor-pointer"
                            />
                        </div>
                        {(dateRange.startDate || dateRange.endDate) && (
                            <button
                                onClick={() => setDateRange({ startDate: '', endDate: '' })}
                                className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Clear Dates"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="mb-4 text-sm font-bold text-blue-600 animate-pulse flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Refreshing stats...
                    </div>
                )}

                {}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatsCard
                        title="Total Users"
                        value={stats?.totalUsers ?? 0}
                        icon={<Users className="w-6 h-6" />}
                    />
                    <StatsCard
                        title="Total Vehicles"
                        value={stats.totalVehicles}
                        icon={<Car className="w-6 h-6" />}
                    />
                    <StatsCard
                        title="Total Revenue"
                        value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
                        icon={<DollarSign className="w-6 h-6" />}
                    />
                    <StatsCard
                        title="Total Bookings"
                        value={stats.totalBookings}
                        icon={<Calendar className="w-6 h-6" />}
                    />
                    <StatsCard
                        title="Active Bookings"
                        value={stats.activeBookings}
                        icon={<Clock className="w-6 h-6" />}
                    />
                    <StatsCard
                        title="Available Vehicles"
                        value={stats.availableVehicles}
                        icon={<CheckCircle className="w-6 h-6" />}
                    />
                </div>

                {}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex items-center justify-around gap-4 flex-wrap">
                    <div className="text-center">
                        <span className="text-gray-500 text-sm font-bold uppercase tracking-wide">Completed</span>
                        <h4 className="text-2xl font-black text-green-600 mt-1">{stats.bookingStatus.completed}</h4>
                    </div>
                    <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
                    <div className="text-center">
                        <span className="text-gray-500 text-sm font-bold uppercase tracking-wide">Pending</span>
                        <h4 className="text-2xl font-black text-yellow-500 mt-1">{stats.bookingStatus.pending}</h4>
                    </div>
                    <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
                    <div className="text-center">
                        <span className="text-gray-500 text-sm font-bold uppercase tracking-wide">Cancelled</span>
                        <h4 className="text-2xl font-black text-red-500 mt-1">{stats.bookingStatus.cancelled}</h4>
                    </div>
                </div>

                {}
                <DashboardCharts
                    bookingsTrend={stats.bookingsTrend}
                    revenueTrend={stats.revenueTrend}
                    vehicleUsage={stats.vehicleUsage}
                />

                {}
                <RecentBookingsTable bookings={stats.recentBookings} />
            </div>
        </div>
    );
};

export default AdminDashboard;
