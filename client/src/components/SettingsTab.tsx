import { useEffect, useRef, useState, useCallback } from 'react';
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

/**
 * Settings tab: profile name & phone editing, profile photo upload with
 * interactive resizing, zoom/crop, live preview, lightbox, and sign out.
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

  // Photo Resizer & Studio state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [viewPhotoModalOpen, setViewPhotoModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [targetSize, setTargetSize] = useState<256 | 512 | 800>(512);
  const [scale, setScale] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

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
      setToast({ type: 'success', message: 'Profile details updated successfully' });
      if (onProfileUpdated) onProfileUpdated(u);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  }

  // Handle photo file selection from disk
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Please select an image file (JPEG, PNG, WebP)' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setRawImageSrc(src);
        setScale(1.0);
        setOffsetX(0);
        setOffsetY(0);
        setTargetSize(512);
        setCropModalOpen(true);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);

    // Reset input value so re-selecting same file works
    e.target.value = '';
  }

  // Render preview canvas in real-time as scale and offsets change
  const drawPreview = useCallback(() => {
    if (!rawImageSrc || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const size = 320;
      canvas.width = size;
      canvas.height = size;

      ctx.clearRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      let drawW = size;
      let drawH = size;
      if (nw >= nh) {
        drawH = size;
        drawW = size * (nw / nh);
      } else {
        drawW = size;
        drawH = size * (nh / nw);
      }

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.translate((offsetX / 100) * (size / 2), (offsetY / 100) * (size / 2));
      ctx.scale(scale, scale);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    };
    img.src = rawImageSrc;
  }, [rawImageSrc, scale, offsetX, offsetY]);

  useEffect(() => {
    if (cropModalOpen) {
      drawPreview();
    }
  }, [cropModalOpen, drawPreview]);

  // Export resized image to canvas blob and upload to backend
  async function handleApplyAndUpload() {
    if (!rawImageSrc) return;
    setUploading(true);
    setToast(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = rawImageSrc;
      });

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = targetSize;
      exportCanvas.height = targetSize;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      let drawW = targetSize;
      let drawH = targetSize;
      if (nw >= nh) {
        drawH = targetSize;
        drawW = targetSize * (nw / nh);
      } else {
        drawW = targetSize;
        drawH = targetSize * (nh / nw);
      }

      ctx.save();
      ctx.translate(targetSize / 2, targetSize / 2);
      ctx.translate((offsetX / 100) * (targetSize / 2), (offsetY / 100) * (targetSize / 2));
      ctx.scale(scale, scale);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to generate image blob'));
          },
          'image/jpeg',
          0.92
        );
      });

      const file = new File([blob], `avatar_${targetSize}x${targetSize}.jpg`, { type: 'image/jpeg' });
      const result = await api.uploadPhoto(file);
      const newUrl = result.photoUrl || (result.user && result.user.photoUrl);
      setPhotoUrl(newUrl);
      setCropModalOpen(false);
      setToast({
        type: 'success',
        message: `Profile photo resized to ${targetSize}×${targetSize}px and updated successfully!`,
      });
      if (onProfileUpdated) onProfileUpdated({ photoUrl: newUrl });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed';
      setToast({ type: 'error', message: msg });
    } finally {
      setUploading(false);
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
    <div className="max-w-3xl w-full mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your personal information, profile photo, and preferences.</p>
      </div>

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

      {/* Settings Form */}
      {!loading && profile && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-8">
          {/* Avatar, Resize & Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-5">
              {/* Profile Image with Click-to-View or Change */}
              <div className="relative group cursor-pointer" onClick={() => photoUrl ? setViewPhotoModalOpen(true) : fileInputRef.current?.click()}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md group-hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-md group-hover:bg-slate-800 transition-colors">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-950/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] font-bold">
                  <span>{photoUrl ? '👁️ View' : '📷 Upload'}</span>
                </div>
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
                    {profile.role === 'rider' ? 'Motorcycle Rider' : 'Passenger Account'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
                {photoUrl ? (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <span>✓</span> Photo active & visible
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium mt-1.5">No profile photo uploaded yet</p>
                )}
              </div>
            </div>

            {/* Photo Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
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
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>📷 Upload & Resize Photo</span>
              </button>

              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setViewPhotoModalOpen(true)}
                  className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  title="View full picture"
                >
                  <span>👁️ View Photo</span>
                </button>
              )}
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
                {saving ? 'Saving Changes…' : 'Save Details'}
              </button>
            </div>
          </form>

          {/* Sign Out Section */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Sign Out</h4>
              <p className="text-xs text-slate-500">End your current session on this device.</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Photo Crop & Resize Studio Modal */}
      {cropModalOpen && rawImageSrc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Resize & Adjust Profile Photo</h3>
                <p className="text-xs text-slate-500">
                  Original: {originalDimensions.width} × {originalDimensions.height} px
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Canvas Preview Area with Circular Avatar Cutout Mask */}
            <div className="relative mx-auto w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner">
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-contain"
              />
              {/* Circular Avatar Guide Ring */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[85%] h-[85%] rounded-full border-2 border-white/80 shadow-2xl ring-999 ring-black/40" />
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                Live Avatar Preview
              </div>
            </div>

            {/* Target Resolution (Resize Mode) Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Output Resolution (Resize Mode)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { size: 256, label: '256 × 256', sub: 'Fast & Light' },
                  { size: 512, label: '512 × 512', sub: 'Recommended' },
                  { size: 800, label: '800 × 800', sub: 'Ultra HD' },
                ].map((item) => (
                  <button
                    key={item.size}
                    type="button"
                    onClick={() => setTargetSize(item.size as 256 | 512 | 800)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      targetSize === item.size
                        ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-2xs font-extrabold ring-1 ring-brand-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                    }`}
                  >
                    <p className="text-xs">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom / Scale Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Zoom / Scale</span>
                <span className="text-brand-600 font-extrabold">{scale.toFixed(2)}x</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-bold">0.5x</span>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 accent-brand-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-xs text-slate-400 font-bold">3.0x</span>
              </div>
            </div>

            {/* Position Adjustment Sliders */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Horizontal (Pan X)</span>
                  <span>{offsetX}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="2"
                  value={offsetX}
                  onChange={(e) => setOffsetX(parseInt(e.target.value))}
                  className="w-full accent-slate-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>Vertical (Pan Y)</span>
                  <span>{offsetY}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="2"
                  value={offsetY}
                  onChange={(e) => setOffsetY(parseInt(e.target.value))}
                  className="w-full accent-slate-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Reset Button */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Center position:</span>
              <button
                type="button"
                onClick={() => {
                  setScale(1.0);
                  setOffsetX(0);
                  setOffsetY(0);
                }}
                className="text-brand-600 font-bold hover:underline cursor-pointer"
              >
                Reset to Center (1.0x)
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={handleApplyAndUpload}
                className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading…</span>
                  </>
                ) : (
                  <span>Upload & Save Resized Photo</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / View Full Photo Modal */}
      {viewPhotoModalOpen && photoUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setViewPhotoModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">🖼️</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{profile?.name || 'Your'} Profile Photo</h3>
                  <p className="text-[11px] text-slate-500 font-medium">High-resolution preview</p>
                </div>
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
                <span>📷 Change / Resize Photo</span>
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
    </div>
  );
}
