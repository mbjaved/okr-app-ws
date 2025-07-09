"use client";
// src/app/settings/profile/page.tsx

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/avatar";
import { Toast } from "@/components/ui/Toast";

// Best Practice: Typed user profile
interface UserProfile {
  _id?: string;
  name?: string;
  email?: string;
  department?: string;
  designation?: string;
  manager?: string;
  okrsCount?: number;
  role?: string;
  username?: string;
  avatarUrl?: string;
}

function ProfilePage() {
  // --- ProfilePage function start ---
  // Auth wall: Only fetch/render if authenticated
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [managersError, setManagersError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Fetch user profile robustly
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/login');
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/users');
        const users: UserProfile[] = await res.json();
        let current: UserProfile | undefined;
        if ((session?.user as any)?._id) {
          current = users.find(u => u._id === (session?.user as any)?._id);
        }
        if (!current && session?.user?.email) {
          current = users.find(u => u.email === session?.user?.email);
        }
        if (!current) {
          setError('Unable to load profile. Please contact support.');
          setProfile(null);
        } else {
          setProfile(current);
          setForm({
            name: current.name,
            username: current.username,
            email: current.email,
            department: current.department,
            designation: current.designation,
            manager: current.manager,
          });
        }
      } catch (err) {
        setError('Failed to fetch user profile.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [session, status, router]);

  // Fetch managers for dropdown
  useEffect(() => {
    if (!session) return;
    setManagersLoading(true);
    setManagersError(null);
    fetch('/api/users')
      .then(res => res.json())
      .then((users: UserProfile[]) => setManagers(users))
      .catch(() => setManagersError('Could not load manager list'))
      .finally(() => setManagersLoading(false));
  }, [session]);

  // Permissions: Only Admin/Manager can edit
  const canEdit = true;

  // Handle input changes in form
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  // Cancel editing
  function handleCancel() {
    setEditMode(false);
    setForm({
      name: profile?.name,
      email: profile?.email,
      username: profile?.username,
      department: profile?.department,
      designation: profile?.designation,
      manager: profile?.manager,
    });
  }

  // Enable edit mode (handler for edit button)
  function handleEditToggle() {
    setEditMode(true);
    setForm({
      name: profile?.name,
      email: profile?.email,
      username: profile?.username,
      department: profile?.department,
      designation: profile?.designation,
      manager: profile?.manager,
    });
  }

  // Save profile changes (PATCH logic implemented)
  async function handleSave() {
    // If a new avatar file is selected, upload it first
    if (avatarFile) {
      await uploadAvatar();
    }
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setToast({ type: 'error', message: Object.values(errs).join(' ') });
      return;
    }
    if (!profile?._id) {
      setToast({ type: 'error', message: 'Internal error: User ID missing. Please refresh the page or contact support.' });
      return;
    }
    try {
      setLoading(true);
      const payload = {
        _id: profile._id, // Always include _id for PATCH
        name: form.name,
        username: form.username ?? profile.username ?? '',
        email: form.email,
        department: form.department,
        designation: form.designation,
        manager: form.manager,
      };
      console.log('PATCH payload:', payload, 'profile:', profile);
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: 'error', message: data?.error || 'Failed to update profile.' });
      } else {
        setEditMode(false);
        setToast({ type: 'success', message: '✔️ Profile updated successfully!' });
        // Always restore username and avatarUrl from returned data or previous state
        setProfile((prev) => ({
          ...prev,
          ...data,
          username: data.username || prev?.username || '',
          avatarUrl: data.avatarUrl || avatarPreview || prev?.avatarUrl || '', // Prefer backend, then preview, then previous
        }));
        setForm((prev) => ({
          ...prev,
          name: data.name,
          username: data.username || profile?.username || '',
          email: data.email,
          department: data.department,
          designation: data.designation,
          manager: data.manager,
          avatarUrl: data.avatarUrl || avatarPreview || prev?.avatarUrl || '', // Prefer backend, then preview, then previous
        }));
        setAvatarPreview(null);
        setAvatarFile(null);
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  function validate() {
    const errs: { [key: string]: string } = {};
    if (!form.name?.trim()) errs.name = "Name is required.";
    if (!form.username?.trim()) errs.username = "Username is required.";
    if (!form.email?.trim()) errs.email = "Email is required.";
    // Add more validation as needed
    return errs;
  }

  // Avatar file input handler
  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file.');
      return;
    }
    setAvatarFile(file);
    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function cancelAvatarPreview() {
    setShowCancelModal(true);
  }

  function confirmCancelAvatar() {
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarError(null);
    setShowCancelModal(false);
  }

  function closeCancelModal() {
    setShowCancelModal(false);
  }

  async function uploadAvatar() {
    if (!avatarFile || !profile?._id) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await fetch(`/api/users/avatar?id=${profile._id}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload avatar');
      setToast({ type: 'success', message: 'Avatar updated!' });
      // Always update profile and form with new avatarUrl and username instantly
      setProfile((prev) => ({
        ...prev,
        avatarUrl: data.avatarUrl || avatarPreview || '',
        username: prev?.username || data.username || '',
        _id: prev?._id,
      }));
      setForm((prev) => ({
        ...prev,
        avatarUrl: data.avatarUrl || avatarPreview || '',
        username: prev?.username || data.username || '',
      }));
      setAvatarPreview(null);
      setAvatarFile(null);
      // Refresh session so TopNav updates avatar (next-auth best practice)
      if (typeof window !== 'undefined' && typeof (session as any)?.update === 'function') {
        await (session as any).update();
      } else if (typeof router.refresh === 'function') {
        router.refresh();
      }
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <main className="relative max-w-3xl mx-auto flex flex-col items-center p-4 pt-8 md:p-8">
      {/* Profile Card */}
      <div className="relative w-full bg-white rounded-2xl shadow-xl flex flex-col items-center px-4 py-6 md:px-10 md:py-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center w-full mt-4 mb-4">
          <div className="relative flex flex-col items-center">
            <Avatar
              user={{ ...profile, avatarUrl: avatarPreview || profile?.avatarUrl || undefined }}
              src={avatarPreview || profile?.avatarUrl || undefined}
              alt="Profile Avatar"
              size="xl"
              className="mx-auto shadow-lg border-4 border-white bg-gray-100"
            />
            {editMode && (
              <label htmlFor="avatar-upload"
                className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg cursor-pointer transition focus:ring-2 focus:ring-blue-300 border-2 border-white"
                style={{ zIndex: 20 }}
                aria-label="Edit profile image"
                tabIndex={0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 1 1 3.182 3.182L7.5 20.213 3 21l.787-4.5L16.863 4.487z" />
                </svg>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFile}
                  disabled={avatarUploading}
                />
              </label>
            )}
          </div>
          {/* Remove Avatar Button (Text) */}
          {(avatarPreview || (profile && profile.avatarUrl)) && editMode && (
  <button
    type="button"
    className="mt-3 text-red-600 hover:underline text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300 transition disabled:opacity-50"
    aria-label="Remove profile image"
    onClick={async () => {
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarUploading(true);
      try {
        const res = await fetch('/api/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: profile?._id, avatarUrl: '' }),
        });
        if (!res.ok) throw new Error('Failed to remove avatar');
        setProfile({ ...profile, avatarUrl: '' });
        setToast({ type: 'success', message: 'Avatar removed.' });
      } catch (err: any) {
        setToast({ type: 'error', message: err.message || 'Failed to remove avatar.' });
      } finally {
        setAvatarUploading(false);
      }
    }}
    title="Remove profile image"
    disabled={avatarUploading}
  >
    Remove profile image
  </button>
)}
          {avatarUploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}
          {avatarError && <div className="text-red-500 text-xs mt-2">{avatarError}</div>}
        </div>
        {/* Floating Edit Button with Modern Tooltip */}
        {!editMode && canEdit && (
          <div className="absolute top-4 right-4 flex flex-col items-center group">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              onClick={handleEditToggle}
              aria-label="Edit Profile"
              tabIndex={0}
            >
              {/* Pencil Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l2 2m-2-2l-2-2m-6 6l6-6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 20.213l-4.182.545.545-4.182L16.862 3.487z" />
              </svg>
            </button>
            {/* Custom Tooltip */}
            <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity absolute -top-9 right-1/2 translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-1 shadow-lg z-20 whitespace-nowrap">
              Edit Profile
            </div>
          </div>
        )}
        {/* Account Info */}
        <h2 className="text-xl font-bold mb-4 text-blue-700 text-center mt-4">Account Info</h2>
        <div className="space-y-4 max-w-md w-full mx-auto">
          {/* Display Name */}
          <div>
            <label htmlFor="display-name-input" className="block text-xs font-semibold text-gray-500 mb-1">Display Name</label>
            <input
              id="display-name-input"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-blue-50/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-lg text-gray-900 transition placeholder-gray-400"
              name="name"
              value={editMode ? (form.name ?? profile?.name ?? '') : (profile?.name ?? '')}
              onChange={handleChange}
              placeholder="Full Name"
              aria-label="Full Name"
              maxLength={64}
              readOnly={!editMode}
              tabIndex={editMode ? 0 : -1}
              autoComplete="off"
            />
          </div>
          {/* Username */}
          <div className="flex flex-col gap-1 w-full mb-4">
            <label htmlFor="username" className="text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              type="text"
              className={
                editMode
                  ? "w-full px-4 py-2 rounded-lg border border-gray-200 bg-blue-50/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-lg text-gray-900 transition placeholder-gray-400"
                  : "w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed outline-none text-lg transition placeholder-gray-300"
              }
              name="username"
              value={editMode ? (form.username ?? profile?.username ?? '') : (profile?.username ?? '')}
              onChange={editMode ? handleChange : undefined}
              readOnly={!editMode}
              tabIndex={editMode ? 0 : -1}
              autoComplete="off"
              aria-readonly={!editMode}
              disabled={!editMode}
            />
            {editMode && (
              <span className="text-xs text-gray-400 mt-1">Must be unique, 4–32 characters. Used for login and mentions.</span>
            )}
          </div>
          {/* Email */}
          <div>
            <label htmlFor="email-input" className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
            <input
              id="email-input"
              type="email"
              className={
                editMode
                  ? "w-full px-4 py-2 rounded-lg border border-gray-200 bg-blue-50/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-lg text-gray-900 transition placeholder-gray-400"
                  : "w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed outline-none text-lg transition placeholder-gray-300"
              }
              name="email"
              value={editMode ? (form.email ?? profile?.email ?? '') : (profile?.email ?? '')}
              onChange={editMode ? handleChange : undefined}
              readOnly={!editMode}
              tabIndex={editMode ? 0 : -1}
              autoComplete="off"
              aria-readonly={!editMode}
              disabled={!editMode}
            />
          </div>
          {/* Manager */}
          <div>
            <label htmlFor="manager-input" className="block text-xs font-semibold text-gray-500 mb-1">Manager</label>
            {editMode ? (
              managersLoading ? (
                <span className="text-gray-400 text-sm">Loading...</span>
              ) : managersError ? (
                <input
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-blue-50/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-900 transition placeholder-gray-400"
                  name="manager"
                  value={form.manager}
                  onChange={handleChange}
                  aria-label="Manager"
                  title="Select a manager for this profile."
                  placeholder="Enter manager name/email"
                />
              ) : (
                <select
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-blue-50/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-gray-900 transition"
                  name="manager"
                  value={form.manager}
                  onChange={handleChange}
                  aria-label="Manager"
                  disabled={managersLoading}
                >
                  <option value="-">-</option>
                  {managers.map((mgr) => (
                    <option key={mgr._id} value={mgr._id}>{mgr.name} ({mgr.username})</option>
                  ))}
                </select>
              )
            ) : (
              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 outline-none text-sm transition placeholder-gray-400"
                value={(() => {
                  if (!profile?.manager || profile.manager === '-') return '-';
                  const mgr = managers.find((u: any) => String(u._id) === String(profile.manager));
                  return (mgr ? (mgr.username || mgr.name || mgr.email) : profile.manager) || '-';
                })()}
                readOnly
                disabled
                tabIndex={-1}
                aria-readonly="true"
              />
            )}
          </div>
        </div>
        {/* Action Buttons */}
        {editMode && (
          <div className="flex justify-between items-center mt-6 gap-2">
            <div className="flex gap-3">
              <button
                className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                onClick={handleSave}
                aria-label="Save Changes"
              >
                Save
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                onClick={handleCancel}
                aria-label="Cancel Editing"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Feedback Toasts */}
      <Toast
        message={toast?.message || ''}
        type={toast?.type ?? 'info'}
        open={!!toast}
        onClose={() => setToast(null)}
        duration={2500}
      />
    </main>
  );
}

export default ProfilePage;