import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, Plus, LogOut, MapPin, Tv, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenAddPlaylist: () => void;
  onToggleMobileSidebar: () => void;
  onToggleDesktopSidebar?: () => void;
  isDesktopSidebarCollapsed?: boolean;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddPlaylist,
  onToggleMobileSidebar,
  onToggleDesktopSidebar,
  isDesktopSidebarCollapsed,
  onOpenSearch,
}) => {
  const { user, logout, isAuthenticated, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user?.username ? user.username : 'Austin';

  return (
    <header className="shrink-0 sticky top-0 z-30 flex h-16 sm:h-18 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md lg:px-8 shadow-sm font-sans">
      {/* Left: Sidebar Toggle & User Profile Bar */}
      <div className="flex items-center gap-3">
        {isAuthenticated && onToggleDesktopSidebar && isDesktopSidebarCollapsed && (
          <button
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-foreground transition-all shadow-sm active:scale-95 group"
            title="Show Sidebar"
          >
            <Menu className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        )}

        <Link to="/profile" className="relative group flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-sm ring-1 ring-border transition group-hover:bg-primary/90">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Live Hub</span>
            </div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              {displayName}
            </h2>
          </div>
        </Link>
      </div>

      {/* Center: Brand name */}
      <Link to="/channels" className="hidden md:flex items-center gap-2.5 group">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-sm transition group-hover:scale-105">
          <Tv className="h-4 w-4 fill-current stroke-[2]" />
        </div>
        <span className="text-base font-bold tracking-tight text-foreground font-sans">
          CINE<span className="text-muted-foreground">VERSE</span>
        </span>
      </Link>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Search trigger button in header */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition shadow-sm"
            title="Search Channels (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={onOpenAddPlaylist}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-semibold hover:bg-primary/90 transition shadow-sm active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add M3U</span>
        </button>

        {/* Minimal Notification Pill */}
        <button
          onClick={() => alert('All live TV channels and streams are operating smoothly!')}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition shadow-sm"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Minimal Mobile Menu Pill */}
        <button
          onClick={onToggleMobileSidebar}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition shadow-sm lg:hidden"
          title="Menu & Settings"
        >
          <Menu className="h-4 w-4" />
        </button>

        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-secondary border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition shadow-sm"
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={loginAsDemo}
            className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 transition shadow-sm"
          >
            Demo Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
