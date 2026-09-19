import React, { useState } from 'react';
import { userApi } from '../api/user';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Calendar, Layers, Star, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [username, setUsername] = useState<string>(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match');
      return;
    }

    setIsUpdating(true);
    try {
      await userApi.updateProfile({
        username: username.trim() !== user?.username ? username.trim() : undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      await refreshProfile();
      setStatusMessage('Profile updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const displayName = user?.username || 'Austin';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Account Profile</h1>
          <p className="text-xs text-muted-foreground">Manage your credentials, preferences, and Cineverse profile</p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-lg bg-card p-6 sm:p-7 border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xl font-bold uppercase shadow-sm">
              {displayName.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
              <p className="text-xs text-muted-foreground font-mono">{user?.email || 'austin@cineverse.tv'}</p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-foreground" />
                <span>
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'September 2026'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 sm:border-l sm:border-border sm:pl-6">
            <div className="rounded-lg border border-border bg-secondary p-3.5 text-center min-w-[95px]">
              <div className="flex justify-center text-foreground mb-1">
                <Layers className="h-4 w-4" />
              </div>
              <p className="text-base font-bold text-foreground font-mono">{user?.playlistCount || 2}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium font-mono">Playlists</p>
            </div>

            <div className="rounded-lg border border-border bg-secondary p-3.5 text-center min-w-[95px]">
              <div className="flex justify-center text-foreground mb-1">
                <Star className="h-4 w-4 fill-foreground" />
              </div>
              <p className="text-base font-bold text-foreground font-mono">{user?.favoriteCount || 5}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium font-mono">Favorites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="rounded-lg bg-card p-6 sm:p-7 border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Account Settings</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Update your username or security credentials</p>

        {statusMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary p-3 text-xs text-foreground">
            <CheckCircle className="h-4 w-4 shrink-0 text-foreground" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground">Display Username</label>
            <div className="relative mt-1.5 flex items-center">
              <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-border focus:outline-none transition"
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground">Change Password (optional)</h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">Current Password</label>
            <div className="relative mt-1.5 flex items-center">
              <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-border focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground">New Password</label>
              <div className="relative mt-1.5 flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-border focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground">Confirm Password</label>
              <div className="relative mt-1.5 flex items-center">
                <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-border focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end border-t border-border">
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition active:scale-95 disabled:opacity-50"
            >
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
