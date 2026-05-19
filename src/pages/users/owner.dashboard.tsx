import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import Navbar from '../../components/user/Navbar';
import {
  TrendingUp, Car, Calendar, Zap, Clock, AlertCircle,
  ArrowUpRight, RefreshCw, LayoutDashboard
} from 'lucide-react';
import { OwnerDashboardApi, type OwnerDashboardStats } from '../../services/api/user/owner.dashboard.api';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  badge?: { label: string; color: string } | null;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, icon, gradient, iconBg, badge, delay = 0
}) => (
  <div
    className="relative overflow-hidden rounded-2xl p-6 shadow-lg border border-white/10 animate-fade-in"
    style={{
      background: gradient,
      animationDelay: `${delay}ms`,
    }}
  >
    {/* Decorative circle */}
    <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 bg-white" />
    <div className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full opacity-10 bg-white" />

    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/70 mb-1">{title}</p>
        <p className="text-3xl font-black text-white tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-xs text-white/60 mt-1">{subtitle}</p>
        )}
        {badge && (
          <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.color}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
  </div>
);

const OwnerDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await OwnerDashboardApi.getStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load dashboard stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cards: StatCardProps[] = stats
    ? [
        {
          title: 'Total Revenue',
          value: fmtCurrency(stats.totalRevenue),
          subtitle: 'All time advance earnings',
          icon: <TrendingUp className="w-6 h-6 text-white" />,
          gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          iconBg: 'bg-white/20',
          badge: null,
          delay: 0,
        },
        {
          title: 'Total Bookings',
          value: fmt(stats.totalBookings),
          subtitle: 'Total trips completed or active',
          icon: <Calendar className="w-6 h-6 text-white" />,
          gradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
          iconBg: 'bg-white/20',
          badge: null,
          delay: 80,
        },
        {
          title: 'Total Vehicles Listed',
          value: fmt(stats.totalVehicles),
          subtitle: `${stats.activeVehicles} currently active`,
          icon: <Car className="w-6 h-6 text-white" />,
          gradient: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
          iconBg: 'bg-white/20',
          badge: null,
          delay: 160,
        },
        {
          title: 'Active Vehicles',
          value: fmt(stats.activeVehicles),
          subtitle: 'Approved and available for rent',
          icon: <Zap className="w-6 h-6 text-white" />,
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
          iconBg: 'bg-white/20',
          badge:
            stats.activeVehicles < stats.totalVehicles
              ? {
                  label: `${stats.totalVehicles - stats.activeVehicles} inactive`,
                  color: 'bg-white/20 text-white',
                }
              : null,
          delay: 240,
        },
        {
          title: 'Earnings This Month',
          value: fmtCurrency(stats.earningsThisMonth),
          subtitle: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
          icon: <ArrowUpRight className="w-6 h-6 text-white" />,
          gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
          iconBg: 'bg-white/20',
          badge: null,
          delay: 320,
        },
        {
          title: 'Pending Payments',
          value: fmt(stats.pendingPayments),
          subtitle: 'Bookings approved — awaiting advance',
          icon: <AlertCircle className="w-6 h-6 text-white" />,
          gradient:
            stats.pendingPayments > 0
              ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
              : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
          iconBg: 'bg-white/20',
          badge:
            stats.pendingPayments > 0
              ? { label: 'Action needed', color: 'bg-white/20 text-white' }
              : null,
          delay: 400,
        },
        {
          title: 'Cancelled Bookings',
          value: fmt(stats.totalCancelled),
          subtitle: 'Total cancelled rentals',
          icon: <AlertCircle className="w-6 h-6 text-white" />,
          gradient: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
          iconBg: 'bg-white/20',
          badge: null,
          delay: 480,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Owner Dashboard</h1>
              <p className="text-xs text-gray-500">
                {lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              to="/vehicles/my-vehicles"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
            >
              <Car className="w-4 h-4" />
              My Vehicles
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cards.map((card) => (
                <StatCard key={card.title} {...card} />
              ))}
            </div>

            {/* Quick links */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/vehicles/my-vehicles"
                className="group flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Car className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Manage Vehicles</p>
                    <p className="text-xs text-gray-500">View, edit or add your listings</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>

              <Link
                to="/user/my-bookings"
                className="group flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Booking History</p>
                    <p className="text-xs text-gray-500">Track all your trips and payments</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease both;
        }
      `}</style>
    </div>
  );
};

export default OwnerDashboardPage;
