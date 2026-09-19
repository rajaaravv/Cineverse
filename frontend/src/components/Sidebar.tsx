import React from 'react';
import { NavLink } from 'react-router-dom';
import { Tv, ListFilter, Star, History, User, PlayCircle, X, Menu } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { currentChannel, isPlayerOpen, openPlayer, playChannel } = usePlayer();

  const navItems = [
    { to: '/channels', label: 'Channels', icon: Tv },
    { to: '/playlists', label: 'Playlists', icon: ListFilter },
    { to: '/favorites', label: 'Favorites', icon: Star },
    { to: '/history', label: 'Watch History', icon: History },
    { to: '/profile', label: 'Account Profile', icon: User },
  ];

  const content = (
    <div className="flex h-full flex-col justify-between p-4 font-sans">
      <div className="space-y-4">
        {/* Top Header inside Sidebar with Hide/Toggle Button */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Tv className="h-3 w-3 fill-current stroke-[2]" />
            </div>
            <span className="text-[11px] font-mono font-bold text-foreground tracking-wider uppercase">Menu</span>
          </div>

          {/* Hide Sidebar Button */}
          <button
            onClick={onToggleCollapse || onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-foreground transition-all shadow-sm active:scale-95 group"
            title="Hide Sidebar"
          >
            <Menu className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>

        <nav className="space-y-1 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Now Playing Widget */}
        {currentChannel && (
          <div className="rounded-lg border border-border bg-card p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-foreground font-bold">Live Stream</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-md bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                {currentChannel.tvgLogo ? (
                  <img src={currentChannel.tvgLogo} alt={currentChannel.name} className="h-full w-full object-cover" />
                ) : (
                  <Tv className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{currentChannel.name}</p>
                <p className="truncate text-[10px] text-muted-foreground font-mono">{currentChannel.groupTitle}</p>
              </div>
            </div>
            {!isPlayerOpen && (
              <button
                onClick={openPlayer}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground py-1.5 text-xs font-semibold shadow-sm hover:bg-primary/90 transition"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                <span>Resume Player</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-3 text-[11px] text-muted-foreground">
        <p className="font-semibold text-foreground font-mono flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span>CINEVERSE</span>
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground font-mono">Minimalist IPTV engine</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Toggled via isCollapsed) */}
      {!isCollapsed && (
        <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground lg:flex flex-col h-full overflow-y-auto">
          {content}
        </aside>
      )}

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="fixed inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground shadow-2xl border-r border-border">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
