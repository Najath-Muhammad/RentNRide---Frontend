import React, { useEffect, useState } from 'react';
import { Crown, Calendar, Car, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';
import Navbar from '../../components/user/Navbar';
import { SubscriptionApi, type UserSubscription, type SubscriptionPlan } from '../../services/api/admin/subscription.api';
import { SubscriptionPaymentModal } from '../../components/common/SubscriptionPaymentModal';

const MySubscription: React.FC = () => {
    const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
    const [history, setHistory] = useState<UserSubscription[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [sub, hist, availablePlans] = await Promise.all([
                    SubscriptionApi.getMySubscription(),
                    SubscriptionApi.getMySubscriptionHistory({ page: historyPage, limit: 5 }),
                    SubscriptionApi.getPublicPlans(),
                ]);
                setActiveSubscription(sub);
                setHistory(hist.data);
                setHistoryTotalPages(hist.totalPages);
                setPlans(availablePlans);
            } catch (err) {
                console.error('Failed to load subscription:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [historyPage]);

    const handleSubscribeClick = (planId: string) => {
        setSelectedPlanId(planId);
        setPaymentModalOpen(true);
    };

    const handlePaymentSuccess = async () => {
        setPaymentModalOpen(false);
        setSelectedPlanId(null);
        // Reload subscriptions to reflect the newly activated one
        try {
            const [sub, hist] = await Promise.all([
                SubscriptionApi.getMySubscription(),
                SubscriptionApi.getMySubscriptionHistory({ page: 1, limit: 5 }),
            ]);
            setActiveSubscription(sub);
            setHistory(hist.data);
        } catch (error) {
            console.error('Failed to reload subscription:', error);
        }
    };

    const plan = activeSubscription?.planId as SubscriptionPlan | undefined;

    const daysLeft = activeSubscription
        ? Math.max(0, Math.ceil((new Date(activeSubscription.endDate).getTime() - Date.now()) / 86400000))
        : 0;

    const statusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Active</span>;
            case 'expired':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><Clock className="w-3 h-3" /> Expired</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Cancelled</span>;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="flex items-center gap-3 mb-8">
                    <Crown className="w-7 h-7 text-emerald-600" />
                    <h1 className="text-2xl font-bold text-gray-900">My Subscription</h1>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* ── Active Subscription Card ── */}
                        {activeSubscription && plan ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-emerald-100 text-sm font-medium">Current Plan</p>
                                            <h2 className="text-white text-2xl font-bold mt-0.5">{plan.name}</h2>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-emerald-100 text-sm">Price</p>
                                            <p className="text-white text-xl font-bold">₹{plan.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-6">
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                                            <Calendar className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                                            <p className="text-xs text-gray-500">Start Date</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                                {new Date(activeSubscription.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                                            <Calendar className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                                            <p className="text-xs text-gray-500">End Date</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-0.5">
                                                {new Date(activeSubscription.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-4 text-center">
                                            <Clock className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                                            <p className="text-xs text-gray-500">Days Left</p>
                                            <p className="text-sm font-bold text-emerald-700 mt-0.5">{daysLeft} days</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mb-4">
                                        <Car className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm text-gray-700">
                                            You can list up to <span className="font-semibold text-gray-900">{plan.vehicleLimit} vehicle{plan.vehicleLimit !== 1 ? 's' : ''}</span>
                                        </span>
                                    </div>

                                    {plan.features.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">Plan Features</p>
                                            <ul className="space-y-1.5">
                                                {plan.features.map((f, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-8">
                                <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 p-6 text-center">
                                    <Crown className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <h2 className="text-lg font-semibold text-gray-700 mb-1">No Active Subscription</h2>
                                    <p className="text-sm text-gray-500">Choose a plan below to get started.</p>
                                </div>
                            </div>
                        )}

                        {/* Available Plans */}
                        {plans.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-base font-semibold text-gray-900 mb-3">Available Plans</h3>
                                <div className="grid gap-4">
                                    {plans.map((p) => {
                                        const isCurrentPlan = activeSubscription && (plan?._id === p._id || (activeSubscription.planId as unknown as string) === p._id);
                                        const isDowngrade = activeSubscription && plan && p.price <= plan.price && !isCurrentPlan;
                                        const isDisabled = isCurrentPlan || isDowngrade;
                                        return (
                                            <div
                                                key={p._id}
                                                className={`bg-white rounded-2xl border ${isCurrentPlan ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-100'} shadow-sm p-5 flex items-center justify-between`}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Crown className={`w-4 h-4 ${isCurrentPlan ? 'text-emerald-600' : 'text-gray-500'}`} />
                                                        <span className={`font-semibold ${isCurrentPlan ? 'text-emerald-700' : 'text-gray-900'}`}>
                                                            {p.name} {isCurrentPlan && '(Current Plan)'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-2">{p.description}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.durationDays} days</span>
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.vehicleLimit} vehicle{p.vehicleLimit !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-4 flex-shrink-0">
                                                    <p className="text-lg font-bold text-gray-900">₹{p.price.toLocaleString()}</p>
                                                    <button
                                                        onClick={() => handleSubscribeClick(p._id)}
                                                        disabled={isDisabled || false}
                                                        className={`mt-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${isDisabled
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                            }`}
                                                    >
                                                        {isCurrentPlan ? 'Active' : isDowngrade ? 'Unavailable' : activeSubscription ? 'Upgrade' : 'Subscribe'}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Subscription History ── */}
                        {history.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h3 className="text-base font-semibold text-gray-900">Subscription History</h3>
                                </div>
                                <ul className="divide-y divide-gray-50">
                                    {history.map((s) => {
                                        const p = s.planId as SubscriptionPlan;
                                        return (
                                            <li key={s._id} className="px-6 py-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{p?.name || '—'}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {new Date(s.startDate).toLocaleDateString()} → {new Date(s.endDate).toLocaleDateString()}
                                                    </p>
                                                    {s.cancelReason && (
                                                        <p className="text-xs text-red-500 mt-0.5">{s.cancelReason}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {statusBadge(s.status)}
                                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {historyTotalPages > 1 && (
                                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                        <button
                                            disabled={historyPage <= 1}
                                            onClick={() => setHistoryPage((p) => p - 1)}
                                            className="text-sm text-gray-600 disabled:opacity-40 hover:text-gray-900"
                                        >
                                            ← Previous
                                        </button>
                                        <span className="text-xs text-gray-500">Page {historyPage} of {historyTotalPages}</span>
                                        <button
                                            disabled={historyPage >= historyTotalPages}
                                            onClick={() => setHistoryPage((p) => p + 1)}
                                            className="text-sm text-gray-600 disabled:opacity-40 hover:text-gray-900"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Subscription Payment Modal */}
            {selectedPlanId && (
                <SubscriptionPaymentModal
                    isOpen={paymentModalOpen}
                    planId={selectedPlanId}
                    onSuccess={handlePaymentSuccess}
                    onClose={() => { setPaymentModalOpen(false); setSelectedPlanId(null); }}
                />
            )}
        </div>
    );
};

export default MySubscription;
