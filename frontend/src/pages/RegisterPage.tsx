import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tv, Lock, User, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/channels', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(username.trim(), email.trim(), password);
      navigate('/channels');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md rounded-lg bg-card p-7 sm:p-9 shadow-sm border border-border">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Tv className="h-6 w-6 fill-current stroke-[2]" />
          </div>
          <h1 className="mt-3.5 text-xl font-bold tracking-tight text-foreground">
            Join CINE<span className="text-muted-foreground">VERSE</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">Create your account to organize and stream IPTV channels</p>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-foreground">Username</label>
            <div className="relative mt-1.5 flex items-center">
              <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                minLength={3}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="austin"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-border focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">Email Address</label>
            <div className="relative mt-1.5 flex items-center">
              <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="austin@cineverse.tv"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-border focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">Password</label>
            <div className="relative mt-1.5 flex items-center">
              <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-border focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition transform active:scale-95 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isLoading ? 'Creating Account...' : 'Get Started'}</span>
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-foreground hover:underline transition">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
