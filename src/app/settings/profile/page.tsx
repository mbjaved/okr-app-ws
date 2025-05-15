"use client";
// src/app/settings/profile/page.tsx

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";

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

const ProfilePage: React.FC = () => {
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
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
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
  const canEdit = profile?.role === "Admin" || profile?.role === "Manager";

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
      department: profile?.department,
      designation: profile?.designation,
      manager: profile?.manager,
    });
  }

  // Save profile changes (PATCH logic implemented)
  async function handleSave() {
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
        name: form.name,
        email: form.email,
        department: form.department,
        designation: form.designation,
        manager: form.manager,
      };
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
        // Optionally refetch user data
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
      setAvatarPreview(null);
      setAvatarFile(null);
      setProfile({ ...profile, avatarUrl: data.avatarUrl });
      // Refresh session so TopNav updates avatar (next-auth best practice)
      if (typeof window !== 'undefined' && typeof session?.update === 'function') {
        await session.update();
      } else if (typeof router.refresh === 'function') {
        router.refresh();
        // As a last resort, force a reload to guarantee TopNav updates
        setTimeout(() => window.location.reload(), 250);
      }
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
    }
  }

  // Early returns for loading/error states
  if (status === 'loading' || loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600 mt-10 text-center">{error}</div>;
  if (!profile) return null;
  if (!session) {
    router.replace('/login');
    return null;
  }

  // --- UI ---
  return (
    <React.Fragment>
      <main>
      <Modal
        open={showCancelModal}
        title="Discard avatar changes?"
        onClose={closeCancelModal}
        actions={
          <>
            <button
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 mr-2"
              onClick={closeCancelModal}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-red-600 text-white"
              onClick={confirmCancelAvatar}
            >
              Discard
            </button>
          </>
        }
      >
        Are you sure you want to discard your avatar changes?
      </Modal>
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
        <div className="flex items-center gap-6 mb-8">
          {/* Avatar */}
          <div className="relative">
            <Avatar src={avatarPreview || profile.avatarUrl} alt={profile.name} size="lg" />
            {/* Avatar upload overlay and controls */}
            {canEdit && !avatarPreview && (
              <div className="absolute bottom-0 right-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                  id="avatar-upload"
                  disabled={avatarUploading}
                />
                <label htmlFor="avatar-upload" className="cursor-pointer bg-blue-600 text-white rounded-full px-3 py-1 text-xs shadow hover:bg-blue-700 transition">
                  Change
                </label>
              </div>
            )}
            {avatarError && <div className="text-red-600 text-xs mt-1">{avatarError}</div>}
            {avatarUploading && !avatarPreview && (
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white/60 rounded-full z-20">
                <span className="text-blue-600 text-xs">Uploading...</span>
              </div>
            )}
            {avatarPreview && (
              <div className="flex gap-2 mt-2">
                <button className="bg-green-600 text-white px-3 py-1 rounded text-xs" onClick={uploadAvatar} disabled={avatarUploading}>{avatarUploading ? 'Uploading...' : 'Save'}</button>
                <button className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs" onClick={cancelAvatarPreview} disabled={avatarUploading}>Cancel</button>
              </div>
            )}
          </div>
          {/* Name and email */}
          <div>
            <div className="flex items-center mb-1">
              <span className="font-bold text-2xl">{profile.name}</span>
              {canEdit && !editMode && (
                <button
                  className="ml-3 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer hover:bg-blue-50"
                  onClick={handleEditToggle}
                  aria-label="Edit Profile"
                  type="button"
                  tabIndex={0}
                >
                  {/* Pencil icon SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 1 1 3.182 3.182L7.5 20.213l-4.182.545.545-4.182 12.999-12.089z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="text-gray-500 text-sm">{profile.email}</div>
          </div>
        </div>
        {/* Profile fields and controls */}
        <div className="space-y-4 text-[16px]">
          <div className="flex items-center justify-between">
            <span className="font-medium">Username:</span>
            <span>{profile.username || '-'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Manager:</span>
            {editMode ? (
              managersLoading ? (
                <span className="text-gray-400 text-sm">Loading...</span>
              ) : managersError ? (
                <input
                  className="border rounded px-2 py-1 text-sm w-40"
                  name="manager"
                  value={form.manager}
                  onChange={handleChange}
                  aria-label="Manager"
                  title="Select a manager for this profile."
                  placeholder="Enter manager name/email"
                />
              ) : (
                <select
                  className="border rounded px-2 py-1 text-sm w-44"
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
              <span>{(() => {
                if (!profile?.manager || profile.manager === '-') return '-';
                const mgr = managers.find((u: any) => String(u._id) === String(profile.manager));
                return mgr ? (mgr.username || mgr.name || mgr.email) : profile.manager;
              })() || '-'}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">OKRs Created:</span>
            <span>{profile?.okrsCount ?? 0}</span>
          </div>
        </div>
        {/* Save/Cancel controls for edit mode */}
        {canEdit && editMode && (
          <div className="flex gap-2 mt-8">
            <button
              type="button"
              className="bg-blue-600 text-white h-10 px-5 rounded font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              onClick={handleSave}
              aria-label="Save Changes"
            >
              Save Changes
            </button>
            <button
              type="button"
              className="bg-gray-100 text-gray-700 h-10 px-5 rounded font-medium border border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
              onClick={handleCancel}
              aria-label="Cancel Editing"
            >
              Cancel
            </button>
            <button
              type="button"
              className="border border-blue-200 bg-white text-blue-600 h-10 px-5 rounded font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
              aria-label="Change Password"
            >
              Change Password
            </button>
          </div>
        )}
        {/* ARIA live region for toast notifications (accessibility best practice) */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {toast && toast.message}
        </div>
      </div>
    </main>
  </React.Fragment>
);
};

export default ProfilePage;