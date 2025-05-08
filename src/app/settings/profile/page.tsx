"use client";
// src/app/settings/profile/page.tsx
// Best Practice: Accessible, modular, user profile placeholder page
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";

const ProfilePage: React.FC = () => {
  // TODO: Replace with real API/user context for full info and permissions
  const { data: session } = useSession();
  const user = session?.user as any; // Defensive: type guard for custom fields
  const username = user?.username || user?.email?.split("@")[0];
  // Simulated fields for scaffold (replace with real data/fetch as needed)
  const role = user?.role || "Employee";
  const department = user?.department || "-";
  const designation = user?.designation || "-";
  const manager = user?.manager || "-";
  const okrsCount = user?.okrsCount ?? 0;
  // Permissions (replace with real logic)
  const canEdit = role === "Admin" || role === "Manager";

  // Inline editing state
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    department,
    designation,
    manager,
  });
  // Manager dropdown state
  const [managers, setManagers] = useState<any[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [managersError, setManagersError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Handlers
  async function handleEditToggle() {
    setEditMode(true);
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      department,
      designation,
      manager,
    });
    setErrors({});
    // Fetch managers (all users except self)
    setManagersLoading(true);
    setManagersError(null);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Invalid user list');
      // Filter out self
      const filtered = data.filter((u: any) => u._id !== user?._id);
      setManagers(filtered);
    } catch (err: any) {
      setManagersError('Could not load manager list');
      setManagers([]);
    } finally {
      setManagersLoading(false);
    }
  }
  function handleCancel() {
    setEditMode(false);
    setErrors({});
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }
  function validate() {
    const errs: { [key: string]: string } = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    // Add more validation as needed
    return errs;
  }
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function handleSave() {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setToast(null);
    try {
      // PATCH request to update user profile
      // Debug: Log outgoing PATCH payload
      const payload = {
        id: user?._id,
        name: form.name,
        email: form.email,
        department: form.department,
        designation: form.designation,
        manager: form.manager,
      };
      console.log('[Profile PATCH] Payload:', payload);
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: 'error', message: data.error || 'Failed to update profile.' });
        setLoading(false);
        return;
      }
      setEditMode(false);
      setToast({ type: 'success', message: '✔️ Profile updated successfully!' });
      // Refresh session/user context so UI reflects latest info
      try {
        // Try to refresh session (NextAuth v4+)
        if (typeof window !== 'undefined' && window.location) {
          window.location.reload(); // Simple, reliable
        }
        // Alternatively, use getSession() or signIn('credentials') if custom logic is needed
      } catch (sessionErr: any) {
        setToast({ type: 'error', message: 'Profile updated, but failed to refresh session.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="flex items-center gap-5 mb-8">
        <Avatar size="lg" username={username} src={user?.avatarUrl} alt={user?.name || user?.email || 'User'} />
        <div>
          <div className="font-semibold text-xl flex items-center gap-2">
            {editMode ? (
              <input
                className={`border rounded px-2 py-1 text-lg w-40 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                name="name"
                value={form.name}
                onChange={handleChange}
                aria-label="Full Name"
                autoFocus
              />
            ) : (
              <>{user?.name || username}</>
            )}
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${role === 'Admin' ? 'bg-blue-100 text-blue-700' : role === 'Manager' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{role}</span>
          </div>
          {errors.name && <div className="text-red-500 text-xs">{errors.name}</div>}
          <div className="text-gray-500 text-sm">
            {editMode ? (
              <input
                className={`border rounded px-2 py-1 text-sm w-52 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                name="email"
                value={form.email}
                onChange={handleChange}
                aria-label="Email Address"
              />
            ) : (
              user?.email
            )}
          </div>
          {errors.email && <div className="text-red-500 text-xs">{errors.email}</div>}
        </div>
        {canEdit && !editMode && (
          <button className="ml-auto px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-all" aria-label="Edit Profile" onClick={handleEditToggle}>
            Edit
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Username:</span>
          <span>{username}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Department:</span>
          {editMode ? (
            <input
              className="border rounded px-2 py-1 text-sm w-40"
              name="department"
              value={form.department}
              onChange={handleChange}
              aria-label="Department"
            />
          ) : (
            <span>{department}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Designation:</span>
          {editMode ? (
            <input
              className="border rounded px-2 py-1 text-sm w-40"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              aria-label="Designation"
            />
          ) : (
            <span>{designation}</span>
          )}
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
                title="Select a manager for this user."
                placeholder="Enter manager name/email"
              />
            ) : (
              <select
                className="border rounded px-2 py-1 text-sm w-44"
                name="manager"
                value={form.manager}
                onChange={handleChange}
                aria-label="Manager"
                title="Select a manager for this user."
              >
                <option value="">-- Select Manager --</option>
                {managers.map((mgr) => (
                  <option key={mgr._id} value={mgr._id}>
                    {mgr.name || mgr.username || mgr.email} ({mgr.email})
                  </option>
                ))}
              </select>
            )
          ) : (
            <span>{manager} <span className="ml-1 text-gray-400" title="Select a manager for this user.">🛈</span></span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">OKRs Created:</span>
          <span>{okrsCount}</span>
        </div>
      </div>
      {/* Save/Cancel controls for edit mode */}
      {canEdit && editMode && (
        <div className="flex gap-2 mt-6">
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave} aria-label="Save Changes">Save Changes</button>
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded" onClick={handleCancel} aria-label="Cancel Editing">Cancel</button>
        </div>
      )}
      {/* Placeholder for Change Password (future extensibility) */}
      {/*
      <div className="mt-8">
        <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded">Change Password</button>
      </div>
      */}
    </main>
  );
};

export default ProfilePage;
