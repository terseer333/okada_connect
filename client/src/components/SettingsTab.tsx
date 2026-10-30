import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { Icon } from './Icon';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'rider';
  photoUrl?: string | null;
  createdAt?: string;
};

type SettingsTabProps = {
  onLogout: () => void;
  onProfileUpdated?: (updated: Partial<UserProfile>) => void;
};

type SettingsPage = 'menu' | 'profile' | 'about';

/**
 * Settings tab:
 * - Menu view: each feature on a separate card displayed vertically (Profile, About, Log Out)
 * - Clicking a feature opens that specific page with a "Back to Settings" option
 * - Profile page: photo with '+' upload button, full photo on avatar click, name/phone editing (signout excluded)
 * - About page: comprehensive website insights and platform information
 */
export default function SettingsTab({ onLogout, onProfileUpdated }: SettingsTabProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [currentPage, setCurrentPage] = useState<SettingsPage>('menu');
  const [viewPhotoModalOpen, setViewPhotoModalOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user profile on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .userProfile()
      .then((data) => {
        if (!cancelled) {
          const u = data.user || data;
          setProfile(u);
          setName(u.name || '');
          setPhone(u.phone || '');
          setPhotoUrl(u.photoUrl || null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setToast({ type: 'error', message: err.message || 'Failed to load profile' });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Save profile changes (name & phone)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ type: 'error', message: 'Name cannot be empty' });
      return;
    }
    setSaving(true);
    setToast(null);

    try {
      const resp = await api.updateProfile({ name: name.trim(), phone: phone.trim() });
      const u = resp.user || resp;
      setProfile(u);
      setToast({ type: 'success', message: 'Profile information updated successfully' });
      if (onProfileUpdated) onProfileUpdated(u);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  }

  // Direct photo upload when selecting an image file via the '+' button
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Please select a valid image file (JPEG, PNG, WebP)' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setToast({ type: 'error', message: 'Image must be under 10MB in size' });
      return;
    }

    setUploading(true);
    setToast(null);

    try {
      const result = await api.uploadPhoto(file);
      const newUrl = result.photoUrl || (result.user && result.user.photoUrl);
      setPhotoUrl(newUrl);
      setToast({ type: 'success', message: 'Profile photo updated successfully!' });
      if (onProfileUpdated) onProfileUpdated({ photoUrl: newUrl });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed';
      setToast({ type: 'error', message: msg });
    } finally {
      setUploading(false);
      // Reset input value so re-uploading the same file works
      e.target.value = '';
    }
  }

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="max-w-2xl w-full mx-auto p-4 md:p-8 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs font-bold underline ml-4 hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MAIN SETTINGS MENU (Separate vertical cards for each feature)          */}
      {/* ========================================================================= */}
      {currentPage === 'menu' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Select a feature to manage your preferences or view platform info.
            </p>
          </div>

          {/* User Preview Banner if profile loaded */}
          {profile && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-sm flex items-center gap-4">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/20 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-700 text-white flex items-center justify-center font-black text-lg border-2 border-white/20">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white truncate">{profile.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20 uppercase tracking-wide">
                    {profile.role === 'rider' ? 'Rider' : 'Customer'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate">{profile.email}</p>
              </div>
            </div>
          )}

          {/* Distinct Feature Cards Stacked Vertically */}
          <div className="space-y-3.5">
            {/* Card 1: Profile Feature */}
            <button
              type="button"
              onClick={() => setCurrentPage('profile')}
              className="w-full bg-white hover:bg-slate-50 p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-brand-500/50 flex items-center justify-between text-left transition-all duration-150 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon name="user" size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                    Profile
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage your personal information, phone number, and photo
                  </p>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all pl-2">
                <Icon name="arrow" size={18} />
              </div>
            </button>

            {/* Card 2: About Feature */}
            <button
              type="button"
              onClick={() => setCurrentPage('about')}
              className="w-full bg-white hover:bg-slate-50 p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-brand-500/50 flex items-center justify-between text-left transition-all duration-150 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon name="info" size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                    About
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Insights into Okada Connect, safety standards, and mission
                  </p>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all pl-2">
                <Icon name="arrow" size={18} />
              </div>
            </button>

            {/* Card 3: Log Out Feature */}
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="w-full bg-white hover:bg-rose-50/50 p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-rose-300 flex items-center justify-between text-left transition-all duration-150 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon name="logout" size={22} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                    Log Out
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sign out of your account on this device
                  </p>
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all pl-2">
                <Icon name="arrow" size={18} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DEDICATED PROFILE PAGE (Opens when Profile feature card is clicked)     */}
      {/* ========================================================================= */}
      {currentPage === 'profile' && (
        <div className="space-y-6">
          {/* Back Navigation Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentPage('menu')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="rotate-180 inline-block">
                <Icon name="arrow" size={16} />
              </span>
              <span>Back to Settings</span>
            </button>
          </div>

          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Profile Information</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage your personal information, phone number, and profile photo.
            </p>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 animate-pulse space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-slate-200 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 rounded-md w-1/3" />
                  <div className="h-4 bg-slate-100 rounded-md w-1/4" />
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <div className="h-10 bg-slate-100 rounded-xl w-full" />
                <div className="h-10 bg-slate-100 rounded-xl w-full" />
              </div>
            </div>
          )}

          {/* Profile Card & Form */}
          {!loading && profile && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-8">
              {/* Avatar & + Upload Button Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-5">
                  {/* Profile Image: Click to view full photo; '+' to upload new photo */}
                  <div className="relative inline-block">
                    {photoUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewPhotoModalOpen(true)}
                        className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-md group cursor-pointer focus:outline-hidden hover:ring-2 hover:ring-brand-500 transition-all block relative"
                        title="Click to view full photo"
                      >
                        <img
                          src={photoUrl}
                          alt={name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          View
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-md cursor-pointer hover:bg-slate-800 transition-colors"
                        title="Click + to upload photo"
                      >
                        {initials}
                      </button>
                    )}

                    {/* '+' Button to Upload / Change Photo */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-md ring-2 ring-white active:scale-90 transition-all cursor-pointer disabled:opacity-50"
                      title="Upload profile photo"
                      aria-label="Upload profile photo"
                    >
                      {uploading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        <Icon name="plus" size={16} />
                      )}
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-slate-900">{profile.name}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          profile.role === 'rider'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-brand-50 text-brand-700 border border-brand-200'
                        }`}
                      >
                        {profile.role === 'rider' ? 'Motorcycle Rider' : 'Passenger'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                      {photoUrl ? 'Click photo to view • Tap + to upload new photo' : 'Tap + to upload a profile photo'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Form (Name & Phone) */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-600 focus:ring-1 focus:ring-brand-600 text-sm font-semibold"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-600 focus:ring-1 focus:ring-brand-600 text-sm font-semibold"
                    placeholder="e.g. 08012345678"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Email is tied to your account login and cannot be edited.</p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Saving Changes…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEDICATED ABOUT PAGE (Opens when About feature card is clicked)         */}
      {/* ========================================================================= */}
      {currentPage === 'about' && (
        <div className="space-y-6">
          {/* Back Navigation Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentPage('menu')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="rotate-180 inline-block">
                <Icon name="arrow" size={16} />
              </span>
              <span>Back to Settings</span>
            </button>
          </div>

          {/* Hero Banner Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-extrabold tracking-wide uppercase">
                <span>🛵 Urban Mobility Reimagined</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                About Okada Connect
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Okada Connect is an on-demand commercial motorcycle ride-hailing and transit platform built to eliminate urban congestion. We seamlessly bridge passengers with verified, trained motorcycle riders to deliver swift, safe, and reliable transit across metropolitan corridors.
              </p>
            </div>
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Key Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black">
                <Icon name="shield" size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Vetted & Trained Riders</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every rider undergoes mandatory identity verification, vehicle roadworthiness inspection, and defensive safety training before accepting trips.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Icon name="location" size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Live GPS Mutual Tracking</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Real-time satellite GPS tracking with live distance calculations, dynamic ETA, and transparent route visibility from pickup to drop-off.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <Icon name="bolt" size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Beat City Traffic</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Navigate traffic bottlenecks and save up to 70% of commuting time with skilled riders who know the quickest and safest routes.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                <Icon name="wallet" size={20} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Transparent & Cashless Fares</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clear distance-based fare calculations upfront with no surprises. Pay seamlessly via your in-app Okada Wallet or with cash.
              </p>
            </div>
          </div>

          {/* Mission & Vision Statement */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Our Mission</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our mission is to formalize, modernize, and safeguard informal motorcycle transport across African urban centers. By providing technological infrastructure, fair pricing, and rigorous safety standards, Okada Connect transforms everyday commutes into dependable, dignified journeys.
            </p>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-lg font-black text-slate-900">v1.2.0</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase">App Version</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-lg font-black text-brand-600">24/7</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Safety & Support</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
                <p className="text-lg font-black text-emerald-600">Active</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase">System Status</p>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
              <span>© {new Date().getFullYear()} Okada Connect Inc. All rights reserved.</span>
              <span>Need help? Contact support@okadaconnect.com</span>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Full Photo Modal (Clicking Profile Picture) */}
      {viewPhotoModalOpen && photoUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setViewPhotoModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{profile?.name || 'Your'} Profile Photo</h3>
                <p className="text-[11px] text-slate-500 font-medium">Full resolution preview</p>
              </div>
              <button
                type="button"
                onClick={() => setViewPhotoModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner">
              <img
                src={photoUrl}
                alt="Profile photo"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setViewPhotoModalOpen(false);
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl border border-brand-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Icon name="plus" size={15} />
                <span>Change Photo</span>
              </button>
              <button
                type="button"
                onClick={() => setViewPhotoModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Out Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
              <Icon name="logout" size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Sign Out of Okada Connect?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to log out? You will need to sign back in to access your rides and wallet.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
