import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Star, User, History } from 'lucide-react';

interface BottomNavDockProps {
  onOpenSearch: () => void;
}

export const BottomNavDock: React.FC<BottomNavDockProps> = ({ onOpenSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4 font-sans">
      <nav className="pointer-events-auto flex items-center gap-1.5 rounded-lg bg-card/90 border border-border p-1.5 shadow-sm backdrop-blur-xl transition-all">
        {/* Home */}
        <button
          onClick={() => navigate('/channels')}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-all ${
            location.pathname === '/channels' || location.pathname === '/'
              ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          title="Home Channels"
        >
          <Home className="h-4 w-4" />
          {(location.pathname === '/channels' || location.pathname === '/') && (
            <span className="font-semibold">Home</span>
          )}
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          title="Search Channels (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
        </button>

        {/* Favorites */}
        <button
          onClick={() => navigate('/favorites')}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-all ${
            location.pathname === '/favorites'
              ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          title="Favorite Channels"
        >
          <Star className={`h-4 w-4 ${location.pathname === '/favorites' ? 'fill-current' : ''}`} />
          {location.pathname === '/favorites' && <span className="font-semibold">Favorites</span>}
        </button>

        {/* Watch History */}
        <button
          onClick={() => navigate('/history')}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-all ${
            location.pathname === '/history'
              ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          title="Watch History"
        >
          <History className="h-4 w-4" />
          {location.pathname === '/history' && <span className="font-semibold">History</span>}
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate('/profile')}
          className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-all ${
            location.pathname === '/profile'
              ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          title="Account Profile"
        >
          <User className="h-4 w-4" />
          {location.pathname === '/profile' && <span className="font-semibold">Profile</span>}
        </button>
      </nav>
    </div>
  );
};

export default BottomNavDock;
