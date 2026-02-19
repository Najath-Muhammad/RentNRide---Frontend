import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Crown, Users, Search } from 'lucide-react';
import AdminTable from '../../components/admin/AdminTable';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import {
    SubscriptionApi,
    type SubscriptionPlan,
    type UserSubscription,
} from '../../services/api/admin/subscription.api';
import { UserApi, type User as AdminUser } from '../../services/api/admin/user.management.api';
import { AxiosError } from 'axios';

const ITEMS_PER_PAGE = 10;

type PlanFormState = {
    name: string;
    description: string;
    price: string;
    durationDays: string;
    vehicleLimit: string;
    features: string[];
};

const defaultPlanForm: PlanFormState = {
    name: '',
    description: '',
    price: '',
    durationDays: '',
    vehicleLimit: '',
    features: [''],
};

const SubscriptionManagement: React.FC = () => {
    // ── Plans state ──────────────────────────────────────────────────────────
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [planPage, setPlanPage] = useState(1);
    const [planTotalPages, setPlanTotalPages] = useState(1);
    const [planTotalItems, setPlanTotalItems] = useState(0);
    const [planSearch, setPlanSearch] = useState('');
    const [debouncedPlanSearch, setDebouncedPlanSearch] = useState('');
    const [plansLoading, setPlansLoading] = useState(true);

    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [planForm, setPlanForm] = useState<PlanFormState>(defaultPlanForm);
    const [planSaving, setPlanSaving] = useState(false);

    // ── User Subscriptions state ─────────────────────────────────────────────
    const [userSubs, setUserSubs] = useState<UserSubscription[]>([]);
    const [subPage, setSubPage] = useState(1);
    const [subTotalPages, setSubTotalPages] = useState(1);
    const [subTotalItems, setSubTotalItems] = useState(0);
    const [subSearch, setSubSearch] = useState('');
    const [debouncedSubSearch, setDebouncedSubSearch] = useState('');
    const [subStatus, setSubStatus] = useState('');
    const [subsLoading, setSubsLoading] = useState(true);

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignUserId, setAssignUserId] = useState('');
    const [assignPlanId, setAssignPlanId] = useState('');
    const [activePlans, setActivePlans] = useState<SubscriptionPlan[]>([]);
    const [assigning, setAssigning] = useState(false);

    // User search for assign modal
    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState<AdminUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const userSearchRef = useRef<HTMLDivElement>(null);

    // ── Modal ────────────────────────────────────────────────────────────────
    const [modal, setModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    }>({ show: false, title: '', message: '', type: 'danger', onConfirm: () => { } });

    const showConfirm = (
        title: string,
        message: string,
        type: 'danger' | 'warning' | 'info',
        onConfirm: () => void,
    ) => setModal({ show: true, title, message, type, onConfirm });
    const closeModal = () => setModal((p) => ({ ...p, show: false }));

    // ── Debounce ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedPlanSearch(planSearch); setPlanPage(1); }, 600);
        return () => clearTimeout(t);
    }, [planSearch]);

    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSubSearch(subSearch); setSubPage(1); }, 600);
        return () => clearTimeout(t);
    }, [subSearch]);

    // ── Load Plans ────────────────────────────────────────────────────────────
    const loadPlans = useCallback(async () => {
        setPlansLoading(true);
        try {
            const data = await SubscriptionApi.getAllPlans({
                page: planPage,
                limit: ITEMS_PER_PAGE,
                search: debouncedPlanSearch || undefined,
            });
            setPlans(data.data);
            setPlanTotalPages(data.totalPages);
            setPlanTotalItems(data.total);
        } catch (err) {
            console.error('Failed to load plans:', err);
        } finally {
            setPlansLoading(false);
        }
    }, [planPage, debouncedPlanSearch]);

    // ── Load User Subscriptions ───────────────────────────────────────────────
    const loadUserSubs = useCallback(async () => {
        setSubsLoading(true);
        try {
            const data = await SubscriptionApi.getAllUserSubscriptions({
                page: subPage,
                limit: ITEMS_PER_PAGE,
                search: debouncedSubSearch || undefined,
                status: subStatus || undefined,
            });
            setUserSubs(data.data);
            setSubTotalPages(data.totalPages);
            setSubTotalItems(data.total);
        } catch (err) {
            console.error('Failed to load user subscriptions:', err);
        } finally {
            setSubsLoading(false);
        }
    }, [subPage, debouncedSubSearch, subStatus]);

    useEffect(() => { loadPlans(); }, [loadPlans]);
    useEffect(() => { loadUserSubs(); }, [loadUserSubs]);
    useEffect(() => { setSubPage(1); }, [subStatus]);

    // Close user dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userSearchRef.current && !userSearchRef.current.contains(e.target as Node)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced user search
    useEffect(() => {
        if (!userSearch.trim() || userSearch.length < 2) {
            setUserResults([]);
            return;
        }
        const t = setTimeout(async () => {
            setUserSearchLoading(true);
            try {
                const res = await UserApi.getUsers({ search: userSearch, limit: 8 });
                setUserResults(res.users);
            } catch {
                setUserResults([]);
            } finally {
                setUserSearchLoading(false);
            }
        }, 400);
        return () => clearTimeout(t);
    }, [userSearch]);

    // ── Plan Modal ────────────────────────────────────────────────────────────
    const openPlanModal = (plan?: SubscriptionPlan) => {
        if (plan) {
            setEditingPlan(plan);
            setPlanForm({
                name: plan.name,
                description: plan.description || '',
                price: String(plan.price),
                durationDays: String(plan.durationDays),
                vehicleLimit: String(plan.vehicleLimit),
                features: plan.features.length > 0 ? plan.features : [''],
            });
        } else {
            setEditingPlan(null);
            setPlanForm(defaultPlanForm);
        }
        setShowPlanModal(true);
    };

    const closePlanModal = () => {
        setShowPlanModal(false);
        setEditingPlan(null);
        setPlanForm(defaultPlanForm);
    };

    const savePlan = async () => {
        if (!planForm.name.trim()) return;
        setPlanSaving(true);
        try {
            const payload = {
                name: planForm.name.trim(),
                description: planForm.description.trim() || undefined,
                price: Number(planForm.price),
                durationDays: Number(planForm.durationDays),
                vehicleLimit: Number(planForm.vehicleLimit),
                features: planForm.features.filter((f) => f.trim() !== ''),
            };
            if (editingPlan) {
                await SubscriptionApi.updatePlan(editingPlan._id, payload);
            } else {
                await SubscriptionApi.createPlan(payload);
            }
            await loadPlans();
            closePlanModal();
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            alert(error.response?.data?.message || error.message || 'Failed to save plan');
        } finally {
            setPlanSaving(false);
        }
    };

    const togglePlanStatus = (plan: SubscriptionPlan) => {
        showConfirm(
            plan.isActive ? 'Disable Plan' : 'Enable Plan',
            `Are you sure you want to ${plan.isActive ? 'disable' : 'enable'} the "${plan.name}" plan?`,
            plan.isActive ? 'warning' : 'info',
            async () => {
                try {
                    await SubscriptionApi.togglePlanStatus(plan._id);
                    await loadPlans();
                    closeModal();
                } catch (err) {
                    console.error('Toggle plan status error:', err);
                }
            },
        );
    };

    // ── Assign Subscription Modal ─────────────────────────────────────────────
    const openAssignModal = async () => {
        try {
            const plans = await SubscriptionApi.getActivePlans();
            setActivePlans(plans);
        } catch {
            setActivePlans([]);
        }
        setAssignUserId('');
        setAssignPlanId('');
        setSelectedUser(null);
        setUserSearch('');
        setUserResults([]);
        setShowAssignModal(true);
    };

    const handleAssign = async () => {
        const userId = selectedUser?._id || assignUserId.trim();
        if (!userId || !assignPlanId) return;
        setAssigning(true);
        try {
            await SubscriptionApi.assignSubscription(userId, assignPlanId);
            await loadUserSubs();
            setShowAssignModal(false);
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            alert(error.response?.data?.message || error.message || 'Failed to assign subscription');
        } finally {
            setAssigning(false);
        }
    };

    const handleCancelSub = (sub: UserSubscription) => {
        showConfirm(
            'Cancel Subscription',
            `Cancel subscription for ${sub.userId?.name || 'this user'}? This cannot be undone.`,
            'danger',
            async () => {
                try {
                    await SubscriptionApi.cancelUserSubscription(sub._id, 'Cancelled by admin');
                    await loadUserSubs();
                    closeModal();
                } catch (err) {
                    console.error('Cancel subscription error:', err);
                }
            },
        );
    };

    // ── Table data ────────────────────────────────────────────────────────────
    const planTableData = plans.map((p) => ({
        _id: p._id,
        name: p.name,
        price: `₹${p.price.toLocaleString()}`,
        duration: `${p.durationDays} days`,
        vehicleLimit: p.vehicleLimit,
        features: p.features.length > 0 ? p.features.slice(0, 2).join(', ') + (p.features.length > 2 ? '…' : '') : '—',
        status: (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {p.isActive ? 'Active' : 'Disabled'}
            </span>
        ),
    }));

    const subTableData = userSubs.map((s) => ({
        _id: s._id,
        user: s.userId?.name || '—',
        email: s.userId?.email || '—',
        plan: (s.planId as SubscriptionPlan)?.name || '—',
        startDate: new Date(s.startDate).toLocaleDateString(),
        endDate: new Date(s.endDate).toLocaleDateString(),
        status: (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-800' :
                s.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-100 text-red-800'
                }`}>
                {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
            </span>
        ),
    }));

    const modalColors = {
        danger: { icon: 'bg-red-100 text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
        warning: { icon: 'bg-yellow-100 text-yellow-600', btn: 'bg-yellow-600 hover:bg-yellow-700' },
        info: { icon: 'bg-blue-100 text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700' },
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar activeItem="Payments & Subscriptions" />

            <div className="flex-1 flex flex-col ml-64">

                {/* ── SECTION 1: Subscription Plans ── */}
                <div className="border-b border-gray-200 bg-white">
                    <div className="px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Crown className="w-6 h-6 text-emerald-600" />
                            <h1 className="text-2xl font-semibold text-gray-900">Subscription Plans</h1>
                        </div>
                        <button
                            onClick={() => openPlanModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <Plus size={20} />
                            Add Plan
                        </button>
                    </div>

                    <div className="pb-8">
                        <AdminTable
                            data={planTableData}
                            columns={[
                                { key: 'name', label: 'Plan Name' },
                                { key: 'price', label: 'Price' },
                                { key: 'duration', label: 'Duration' },
                                { key: 'vehicleLimit', label: 'Vehicle Limit' },
                                { key: 'features', label: 'Features' },
                                { key: 'status', label: 'Status' },
                            ]}
                            title=""
                            searchValue={planSearch}
                            onSearch={setPlanSearch}
                            searchPlaceholder="Search plans..."
                            page={planPage}
                            totalPages={planTotalPages}
                            onPageChange={setPlanPage}
                            totalItems={planTotalItems}
                            actions={(item: { _id: string }) => {
                                const plan = plans.find((p) => p._id === item._id);
                                if (!plan) return [];
                                return [
                                    { label: 'Edit', onClick: () => openPlanModal(plan), className: 'text-blue-600' },
                                    {
                                        label: plan.isActive ? 'Disable' : 'Enable',
                                        onClick: () => togglePlanStatus(plan),
                                        className: plan.isActive ? 'text-red-600' : 'text-green-600',
                                    },
                                ];
                            }}
                            isLoading={plansLoading}
                        />
                    </div>
                </div>

                {/* ── SECTION 2: User Subscriptions ── */}
                <div className="bg-white">
                    <div className="px-8 py-6 flex items-center justify-between border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-emerald-600" />
                            <h1 className="text-2xl font-semibold text-gray-900">User Subscriptions</h1>
                        </div>
                        <button
                            onClick={openAssignModal}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <Plus size={20} />
                            Assign Subscription
                        </button>
                    </div>

                    <div className="px-8 py-4 flex items-center gap-4 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Filter by status:</span>
                        {['', 'active', 'expired', 'cancelled'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSubStatus(s)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${subStatus === s
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="pb-8">
                        <AdminTable
                            data={subTableData}
                            columns={[
                                { key: 'user', label: 'User' },
                                { key: 'email', label: 'Email' },
                                { key: 'plan', label: 'Plan' },
                                { key: 'startDate', label: 'Start Date' },
                                { key: 'endDate', label: 'End Date' },
                                { key: 'status', label: 'Status' },
                            ]}
                            title=""
                            searchValue={subSearch}
                            onSearch={setSubSearch}
                            searchPlaceholder="Search by user name or email..."
                            page={subPage}
                            totalPages={subTotalPages}
                            onPageChange={setSubPage}
                            totalItems={subTotalItems}
                            actions={(item: { _id: string }) => {
                                const sub = userSubs.find((s) => s._id === item._id);
                                if (!sub || sub.status !== 'active') return [];
                                return [
                                    {
                                        label: 'Cancel',
                                        onClick: () => handleCancelSub(sub),
                                        className: 'text-red-600',
                                    },
                                ];
                            }}
                            isLoading={subsLoading}
                        />
                    </div>
                </div>
            </div>

            {/* ── Plan Modal ── */}
            {showPlanModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingPlan ? 'Edit Plan' : 'Add Subscription Plan'}
                            </h2>
                            <button onClick={closePlanModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                                    <input
                                        type="text"
                                        value={planForm.name}
                                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g., Basic, Pro, Enterprise"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={planForm.price}
                                        onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g., 999"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={planForm.durationDays}
                                        onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g., 30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Listing Limit *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={planForm.vehicleLimit}
                                        onChange={(e) => setPlanForm({ ...planForm, vehicleLimit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="e.g., 5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={planForm.description}
                                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    rows={2}
                                    placeholder="Brief description of this plan"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Features</label>
                                    <button
                                        type="button"
                                        onClick={() => setPlanForm((p) => ({ ...p, features: [...p.features, ''] }))}
                                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                    >
                                        + Add Feature
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {planForm.features.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={f}
                                                onChange={(e) => {
                                                    const updated = [...planForm.features];
                                                    updated[i] = e.target.value;
                                                    setPlanForm({ ...planForm, features: updated });
                                                }}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder={`Feature ${i + 1}`}
                                            />
                                            {planForm.features.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPlanForm((p) => ({
                                                            ...p,
                                                            features: p.features.filter((_, idx) => idx !== i),
                                                        }))
                                                    }
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={closePlanModal}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={savePlan}
                                disabled={!planForm.name.trim() || !planForm.price || !planForm.durationDays || !planForm.vehicleLimit || planSaving}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {planSaving ? 'Saving...' : editingPlan ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign Subscription Modal ── */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Assign Subscription</h2>
                            <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* User search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search User *</label>
                                {selectedUser ? (
                                    <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{selectedUser.name}</p>
                                            <p className="text-xs text-gray-500">{selectedUser.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedUser(null); setUserSearch(''); }}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative" ref={userSearchRef}>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={userSearch}
                                                onChange={(e) => { setUserSearch(e.target.value); setShowUserDropdown(true); }}
                                                onFocus={() => setShowUserDropdown(true)}
                                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                                placeholder="Type name or email to search..."
                                            />
                                        </div>
                                        {showUserDropdown && (userSearch.length >= 2) && (
                                            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                                {userSearchLoading ? (
                                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">Searching...</div>
                                                ) : userResults.length > 0 ? (
                                                    userResults.map((u) => (
                                                        <button
                                                            key={u._id}
                                                            onClick={() => { setSelectedUser(u); setShowUserDropdown(false); }}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0"
                                                        >
                                                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                                                            <p className="text-xs text-gray-500">{u.email} · {u.role}</p>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">No users found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Plan select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan *</label>
                                <select
                                    value={assignPlanId}
                                    onChange={(e) => setAssignPlanId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select a plan</option>
                                    {activePlans.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {p.name} — ₹{p.price} / {p.durationDays} days ({p.vehicleLimit} vehicles)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={(!selectedUser && !assignUserId.trim()) || !assignPlanId || assigning}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {assigning ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm Modal ── */}
            {modal.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeModal} />
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${modalColors[modal.type].icon}`}>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">{modal.title}</h3>
                        <p className="mt-2 text-center text-sm text-gray-600">{modal.message}</p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={closeModal} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={modal.onConfirm} className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg ${modalColors[modal.type].btn}`}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionManagement;
