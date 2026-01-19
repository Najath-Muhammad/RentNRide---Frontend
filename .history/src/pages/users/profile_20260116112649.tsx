import React, { useState, useEffect } from 'react';
import { Camera, Edit2, Save, X, Lock, Crown, Mail, Phone, Calendar, ShieldCheck, ChevronRight, Loader2, User as UserIcon, BadgeCheck } from 'lucide-react';
import type { UserProfile, SubscriptionStatus } from '../../services/api/user/profile.api';
import { ProfileApi } from '../../services/api/user/profile.api';
import { uploadToS3 } from '../../utils/s3';
import Navbar from '../../components/user/Navbar';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileRes, subRes] = await Promise.allSettled([
        ProfileApi.getProfile(),
        ProfileApi.getSubscriptionStatus()
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
      } else {
        setSubscription({ plan: 'free', expiresAt: null });
      }
    } catch (error) {
      showError('main', 'An unexpected error occurred while loading profile');
    } finally {
      setLoading(false);
    }
  };

  const showError = (key: string, msg: string) => {
    setErrors(prev => ({ ...prev, [key]: msg }));
    setTimeout(() => setErrors(prev => ({ ...prev, [key]: '' })), 5000);
  };

  const showMessage = (key: string, msg: string) => {
    setMessages(prev => ({ ...prev, [key]: msg }));
    setTimeout(() => setMessages(prev => ({ ...prev, [key]: '' })), 5000);
  };

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
    console.lg

    try {
      setActionLoading(prev => ({ ...prev, photo: true }));
      const publicUrl = await uploadToS3(selectedFile);
      console.log('upload to s3 and here is the public url:',publicUrl)
      await ProfileApi.updateProfilePhoto(publicUrl);

      setProfile(prev => prev ? { ...prev, profilePhoto: publicUrl } : null);
      showMessage('photo', 'Profile photo updated successfully');
      setSelectedFile(null);
    } catch (error: any) {
      showError('photo', error.response?.data?.message || 'Failed to update photo');
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
    } catch (error: any) {
      showError('profile', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setActionLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const handleUpgradePremium = async () => {
    try {
      setActionLoading(prev => ({ ...prev, premium: true }));
      const response = await ProfileApi.upgradeToPremium();
      if (response.success) {
        await loadProfileData();
        showMessage('subscription', 'Welcome to Premium! Your account has been upgraded.');
      }
    } catch (error: any) {
      showError('subscription', error.response?.data?.message || 'Upgrade failed. Please try again.');
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
    } catch (error: any) {
      showError('password', error.response?.data?.message || 'Verification failed. Incorrect current password?');
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

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Sidebar Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-gray-100">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
              <div className="px-6 pb-8 -mt-16 text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-white mb-4 transition-transform hover:scale-[1.02]">
                    <img
                      src={photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=2563eb&color=fff&size=200`}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="absolute bottom-6 right-0 bg-blue-600 text-white p-2.5 rounded-2xl cursor-pointer hover:bg-blue-700 transition shadow-lg hover:shadow-blue-200 ring-2 ring-white">
                    <Camera size={18} />
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                  {profile.name}
                  {profile.role?.toLowerCase() === 'premium' && (
                    <BadgeCheck className="text-blue-500 w-6 h-6" />
                  )}
                </h2>
                <p className="text-gray-500 font-medium mb-6">{profile.email}</p>

                {selectedFile && (
                  <button
                    onClick={handlePhotoUpload}
                    disabled={actionLoading.photo}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
                  >
                    {actionLoading.photo ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    Apply New Avatar
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3 py-4 border-t border-gray-50">
                  <div className="p-3 bg-blue-50/50 rounded-2xl">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Role</p>
                    <p className="text-sm font-bold text-gray-900 capitalize">{profile.role}</p>
                  </div>
                  <div className="p-3 bg-green-50/50 rounded-2xl">
                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Status</p>
                    <p className="text-sm font-bold text-gray-900 capitalize">{profile.status}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loyalty/Premium Banner */}
            {subscription?.plan !== 'premium' ? (
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Crown size={24} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Unlock Exclusive Perks</h3>
                <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                  Upgrade to Premium for prioritized support, lower deposits, and exclusive early access to luxury vehicles.
                </p>
                <button
                  onClick={handleUpgradePremium}
                  disabled={actionLoading.premium}
                  className="w-full bg-white text-indigo-700 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading.premium ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                  Go Premium Now
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                    <Crown size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Premium Active</h3>
                    <p className="text-xs text-blue-600 font-semibold">Gold Tier Member</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">Your subscription is active until:</p>
                <p className="text-lg font-bold text-gray-900">{formatDate(subscription.expiresAt || '')}</p>
              </div>
            )}
          </div>

          {/* Right Column: Details & Security */}
          <div className="lg:col-span-8 space-y-8">

            {/* Account Details */}
            <section className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <UserIcon size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Profile Configuration</h2>
                </div>
                <button
                  onClick={handleEditToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isEditing
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                >
                  {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                  {isEditing ? 'Discard Changes' : 'Update Profile'}
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 mb-1 flex items-center gap-2">
                      Full Legal Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                        placeholder="Enter your name"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-900">{profile.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 mb-1">
                      Contact Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                        placeholder="+1 (555) 000-0000"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {profile.phone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 mb-1">
                      Email Address
                    </label>
                    <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {profile.email}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 mb-1">
                      Member Since
                    </label>
                    <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(profile.createdAt)}
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-4 border-t border-gray-50 flex flex-col items-end gap-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={actionLoading.profile}
                      className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading.profile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      Commit Changes
                    </button>
                    {messages.profile && <p className="text-green-600 text-sm font-bold">{messages.profile}</p>}
                    {errors.profile && <p className="text-red-600 text-sm font-bold">{errors.profile}</p>}
                  </div>
                )}
              </div>
            </section>

            {/* Security Section */}
            <section className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/30">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Security & Credentials</h2>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="Min. 8 characters"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500">Verify Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="Re-type new password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={handlePasswordChange}
                    disabled={actionLoading.password}
                    className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading.password ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    Update Security Key
                  </button>
                  {messages.password && <p className="text-green-600 text-sm font-bold">{messages.password}</p>}
                  {errors.password && <p className="text-red-600 text-sm font-bold">{errors.password}</p>}
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
