import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Edit2, Save, X, Lock, Crown, Mail, Phone, Calendar, ShieldCheck, ChevronRight, Loader2, User as UserIcon, BadgeCheck, CheckCircle, Car } from 'lucide-react';
import { AxiosError } from 'axios';
import type { UserProfile, SubscriptionStatus } from '../../services/api/user/profile.api';
import { ProfileApi } from '../../services/api/user/profile.api';
import { uploadToS3 } from '../../utils/s3';
import Navbar from '../../components/user/Navbar';
import { SubscriptionApi, type SubscriptionPlan } from '../../services/api/admin/subscription.api';
import { WalletApi, type Wallet } from '../../services/api/wallet/wallet.api';
import { WalletFundingModal } from '../../components/common/WalletFundingModal';
import { Wallet as WalletIcon, PlusCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [fundingAmount, setFundingAmount] = useState<number>(500);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const showError = useCallback((key: string, msg: string) => {
    setErrors(prev => ({ ...prev, [key]: msg }));
    setTimeout(() => setErrors(prev => ({ ...prev, [key]: '' })), 5000);
  }, []);

  const showMessage = useCallback((key: string, msg: string) => {
    setMessages(prev => ({ ...prev, [key]: msg }));
    setTimeout(() => setMessages(prev => ({ ...prev, [key]: '' })), 5000);
  }, []);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, subRes, walletRes] = await Promise.allSettled([
        ProfileApi.getProfile(),
        ProfileApi.getSubscriptionStatus(),
        WalletApi.getWallet()
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.success) {
        const profileData = profileRes.value.user;
        setProfile(profileData);
        setEditForm({ name: profileData.name, phone: profileData.phone || '' });
        setPhotoPreview(profileData.profilePhoto);
      } else {
        showError('main', 'Failed to load profile details');
      }
      if (subRes.status === 'fulfilled' && subRes.value.success) {
        setSubscription(subRes.value.subscription);
      }  else if(){

      }

      if (walletRes.status === 'fulfilled' && walletRes.value.success) {
        setWallet(walletRes.value.data);
      }
      console.log('subscription is: ',subscription)
    } catch {
      showError('main', 'An unexpected error occurred while loading profile');
    } finally {
      setLoading(false)
    }
  }, [showError]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('photo', 'Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError('photo', 'Image size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;
    console.log('this is working')

    try {
      setActionLoading(prev => ({ ...prev, photo: true }));
      const publicUrl = await uploadToS3(selectedFile);
      console.log('upload to s3 and here is the public url:', publicUrl)
      await ProfileApi.updateProfilePhoto(publicUrl);

      setProfile(prev => prev ? { ...prev, profilePhoto: publicUrl } : null);
      showMessage('photo', 'Profile photo updated successfully');
      setSelectedFile(null);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      showError('photo', err.response?.data?.message || 'Failed to update photo');
    } finally {
      setActionLoading(prev => ({ ...prev, photo: false }));
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({ name: profile!.name, phone: profile!.phone || '' });
    }
    setIsEditing(!isEditing);
    setErrors({});
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      showError('profile', 'Name is required');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, profile: true }));
      const response = await ProfileApi.updateProfile(editForm);
      if (response.success) {
        setProfile(prev => prev ? { ...prev, ...editForm } : null);
        setIsEditing(false);
        showMessage('profile', 'Profile details updated');
      }
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      showError('profile', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setActionLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const handleUpgradeClick = async () => {
    setShowUpgradeModal(true);
    setSelectedPlanId('');
    setPlansLoading(true);
    try {
      const plans = await SubscriptionApi.getPublicPlans();
      setAvailablePlans(plans);
      if (plans.length > 0) setSelectedPlanId(plans[0]._id);
    } catch {
      setAvailablePlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlanId) return;
    setShowUpgradeModal(false);
    try {
      setActionLoading(prev => ({ ...prev, premium: true }));
      await SubscriptionApi.selfSubscribe(selectedPlanId);
      await loadProfileData();
      showMessage('subscription', 'Welcome to Premium! Your subscription is now active.');
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      showError('subscription', err.response?.data?.message || 'Upgrade failed. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, premium: false }));
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword) {
      showError('password', 'Current password is required');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showError('password', 'New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('password', 'Passwords do not match');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, password: true }));
      const response = await ProfileApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (response.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showMessage('password', 'Security credentials updated safely');
      }
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      showError('password', err.response?.data?.message || 'Verification failed. Incorrect current password?');
    } finally {
      setActionLoading(prev => ({ ...prev, password: false }));
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-500 font-medium animate-pulse">Refining your profile experience...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Unavailable</h2>
            <p className="text-gray-600 mb-6">We couldn't retrieve your account details. Please check your connection or try logging in again.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPremiumActive = subscription?.plan === 'premium' &&
    subscription.expiresAt &&
    new Date(subscription.expiresAt) > new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Left Column: Sidebar Profile Card */}
          <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
            <div className="bg-white rounded-3xl shadow-card overflow-hidden border border-gray-100 relative group">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-700"></div>
              <div className="px-6 pb-8 -mt-16 text-center relative z-10">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-white mb-4">
                    <img
                      src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2563eb&color=fff&size=200`}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="absolute bottom-6 right-0 bg-blue-600 text-white p-2.5 rounded-xl cursor-pointer hover:bg-blue-700 transition shadow-lg ring-4 ring-white">
                    <Camera size={18} />
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>

                <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                  {profile.name}
                  {profile.role?.toLowerCase() === 'premium' && (
                    <BadgeCheck className="text-blue-500 w-5 h-5" />
                  )}
                </h2>
                <p className="text-gray-500 font-medium text-sm mb-2">{profile.email}</p>
                {profile.googleId && (
                  <div className="flex justify-center mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 shadow-sm">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd"><path d="M20.64 12.2045c0-.6381-.0573-1.2518-.1636-1.8409H12v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4" /><path d="M12 21c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H3.9574v2.3318C5.4382 18.9832 8.4818 21 12 21z" fill="#34A853" /><path d="M6.964 13.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V7.9582H3.9573A8.9965 8.9965 0 0 0 3 12c0 1.4523.3477 2.8268.9573 4.0418L6.964 13.71z" fill="#FBBC05" /><path d="M12 5.09c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C16.4632 2.3991 14.426 1.5 12 1.5 8.4818 1.5 5.4382 3.5168 3.9574 6.4582l3.0066 2.3318C7.6718 6.6732 9.656 5.09 12 5.09z" fill="#EA4335" /></g></svg>
                      Google Authenticated
                    </span>
                  </div>
                )}

                {selectedFile && (
                  <button
                    onClick={handlePhotoUpload}
                    disabled={actionLoading.photo}
                    className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mb-4 disabled:opacity-50 text-sm shadow-lg shadow-blue-600/20"
                  >
                    {actionLoading.photo ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save Photo
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Role</p>
                    <p className="text-sm font-bold text-gray-900 capitalize">{profile.role}</p>
                  </div>
                  <div className="p-3 bg-green-50/50 rounded-2xl border border-green-100">
                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Status</p>
                    <p className="text-sm font-bold text-gray-900 capitalize">{profile.status}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loyalty/Premium Banner */}
            {!isPremiumActive ? (
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-card relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                  <Crown size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                      <Crown size={20} className="text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-bold">Go Premium</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    Get prioritized support, zero deposits, and exclusive deals.
                  </p>
                  <button
                    onClick={handleUpgradeClick}
                    disabled={actionLoading.premium}
                    className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    {actionLoading.premium ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                    Upgrade Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Crown size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Premium Active</h3>
                    <p className="text-xs text-blue-600 font-semibold">Gold Tier Member</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">Valid until:</p>
                <p className="text-lg font-bold text-gray-900">{formatDate(subscription.expiresAt || '')}</p>
              </div>
            )}

            {/* Wallet Section */}
            {wallet && (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <WalletIcon size={22} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight">My Wallet</h3>
                      <p className="text-xs text-gray-500 font-medium">Available Balance</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    ₹{wallet.balance.toLocaleString("en-IN")}
                  </h1>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Fund your wallet:</p>
                  <div className="flex gap-2">
                    {[500, 1000, 2000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setFundingAmount(amt)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${fundingAmount === amt
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowWalletModal(true)}
                  className="w-full bg-indigo-600 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-indigo-700 transition font-bold shadow-md shadow-indigo-600/20"
                >
                  <PlusCircle size={18} className="stroke-[2.5]" />
                  Add ₹{fundingAmount}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Details & Security */}
          <div className="flex-1 space-y-6">

            {/* Account Details */}
            <section className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <UserIcon size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Profile Information</h2>
                </div>
                <button
                  onClick={handleEditToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isEditing
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                >
                  {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-sm text-gray-900"
                        placeholder="Enter your name"
                      />
                    ) : (
                      <p className="text-base font-semibold text-gray-900 py-2 border-b border-gray-50">{profile.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-sm text-gray-900"
                        placeholder="+1 (555) 000-0000"
                      />
                    ) : (
                      <p className="text-base font-semibold text-gray-900 py-2 border-b border-gray-50 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {profile.phone || <span className="text-gray-400 italic font-normal">Not provided</span>}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Email Address
                    </label>
                    <p className="text-base font-semibold text-gray-700 py-2 border-b border-gray-50 flex items-center gap-2 opacity-80 cursor-not-allowed">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {profile.email}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Member Since
                    </label>
                    <p className="text-base font-semibold text-gray-700 py-2 border-b border-gray-50 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(profile.createdAt)}
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-end gap-4">
                    {messages.profile && <p className="text-green-600 text-sm font-semibold animate-pulse">{messages.profile}</p>}
                    {errors.profile && <p className="text-red-600 text-sm font-semibold animate-pulse">{errors.profile}</p>}

                    <button
                      onClick={handleSaveProfile}
                      disabled={actionLoading.profile}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                      {actionLoading.profile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Security Section */}
            {profile.googleId ? (
              <section className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <ShieldCheck size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
                </div>

                <div className="p-12 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd"><path d="M20.64 12.2045c0-.6381-.0573-1.2518-.1636-1.8409H12v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4" /><path d="M12 21c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H3.9574v2.3318C5.4382 18.9832 8.4818 21 12 21z" fill="#34A853" /><path d="M6.964 13.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V7.9582H3.9573A8.9965 8.9965 0 0 0 3 12c0 1.4523.3477 2.8268.9573 4.0418L6.964 13.71z" fill="#FBBC05" /><path d="M12 5.09c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C16.4632 2.3991 14.426 1.5 12 1.5 8.4818 1.5 5.4382 3.5168 3.9574 6.4582l3.0066 2.3318C7.6718 6.6732 9.656 5.09 12 5.09z" fill="#EA4335" /></g></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Google Authenticated</h3>
                  <p className="text-gray-500 max-w-sm leading-relaxed">
                    Your account is securely linked with Google. You don't need to manage a separate password here.
                  </p>
                </div>
              </section>
            ) : (
              <section className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <ShieldCheck size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Security Settings</h2>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all text-sm"
                          placeholder="Min. 8 characters"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all text-sm"
                          placeholder="Re-type new password"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 border-t border-gray-50 pt-6">
                    <button
                      onClick={handlePasswordChange}
                      disabled={actionLoading.password}
                      className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-bold hover:bg-black transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                      {actionLoading.password ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                      Update Password
                    </button>
                    {messages.password && <p className="text-green-600 text-sm font-semibold">{messages.password}</p>}
                    {errors.password && <p className="text-red-600 text-sm font-semibold">{errors.password}</p>}
                  </div>
                </div>
              </section>
            )}

          </div>
        </div>
      </main>

      {/* Plan Picker Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
            {/* Gradient top bar */}
            <div className="h-1.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-t-3xl" />

            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl flex items-center justify-center border border-amber-200">
                    <Crown className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Choose a Plan</h3>
                    <p className="text-sm text-gray-500">Select the subscription that fits you best</p>
                  </div>
                </div>
                <button onClick={() => setShowUpgradeModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Plans */}
              {plansLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : availablePlans.length === 0 ? (
                <div className="text-center py-12">
                  <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No plans available at the moment.</p>
                  <p className="text-gray-400 text-sm mt-1">Please contact support to get a subscription.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {availablePlans.map((plan) => {
                    const isSelected = selectedPlanId === plan._id;
                    return (
                      <button
                        key={plan._id}
                        onClick={() => setSelectedPlanId(plan._id)}
                        className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-200 ${isSelected
                          ? 'border-amber-400 bg-amber-50 shadow-md shadow-amber-100'
                          : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'
                          }`}
                      >
                        {/* Selected checkmark */}
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="w-5 h-5 text-amber-500" />
                          </div>
                        )}

                        {/* Plan name & price */}
                        <div className="mb-3">
                          <p className="font-bold text-gray-900 text-base">{plan.name}</p>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-extrabold text-amber-600">₹{plan.price.toLocaleString()}</span>
                            <span className="text-sm text-gray-400">/ {plan.durationDays} days</span>
                          </div>
                        </div>

                        {/* Vehicle limit */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Car className="w-4 h-4 text-gray-400" />
                          <span>List up to <strong>{plan.vehicleLimit}</strong> vehicle{plan.vehicleLimit !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Features */}
                        {plan.features.length > 0 && (
                          <ul className="space-y-1.5">
                            {plan.features.slice(0, 3).map((f, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                            {plan.features.length > 3 && (
                              <li className="text-xs text-gray-400 pl-5">+{plan.features.length - 3} more</li>
                            )}
                          </ul>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              {!plansLoading && availablePlans.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUpgrade}
                    disabled={!selectedPlanId}
                    className="flex-1 py-3.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-amber-600 transition-all shadow-lg shadow-amber-500/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Confirm Upgrade
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <WalletFundingModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        amount={fundingAmount}
        onSuccess={() => {
          setShowWalletModal(false);
          loadProfileData(); // refresh wallet balance
        }}
      />
    </div>
  );
};

export default Profile;
