import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNavDock } from './components/BottomNavDock';
import { LivePlayer } from './components/LivePlayer';
import { MainResumePlayer } from './components/MainResumePlayer';
import { SearchModal } from './components/SearchModal';
import { AddPlaylistModal } from './components/AddPlaylistModal';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { WatchPage } from './pages/WatchPage';
import { LoadingSpinner } from './components/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner message="Loading Cineverse session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading Cineverse session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/channels" replace />;
  }

  return <>{children}</>;
};

const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddPlaylistOpen, setIsAddPlaylistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | undefined>(undefined);
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cineverse_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDesktopSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cineverse_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-hidden">
      {!isAuthPage && (
        <Navbar
          onOpenAddPlaylist={() => setIsAddPlaylistOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onToggleDesktopSidebar={toggleDesktopSidebar}
          isDesktopSidebarCollapsed={isSidebarCollapsed}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {isAuthenticated && !isAuthPage && (
          <Sidebar
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleDesktopSidebar}
          />
        )}

        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 relative scroll-smooth">
          <Routes>
            <Route
              path="/"
              element={<HomePage onOpenAddPlaylist={() => setIsAddPlaylistOpen(true)} />}
            />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/channels"
              element={
                <ProtectedRoute>
                  <ChannelsPage
                    onOpenAddPlaylist={() => setIsAddPlaylistOpen(true)}
                    selectedPlaylistId={selectedPlaylistId}
                    onSelectPlaylist={setSelectedPlaylistId}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playlists"
              element={
                <ProtectedRoute>
                  <PlaylistsPage onOpenAddPlaylist={() => setIsAddPlaylistOpen(true)} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <FavoritesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/watch/:channelId"
              element={
                <ProtectedRoute>
                  <WatchPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Main Floating Resume Player Widget */}
          {isAuthenticated && !isAuthPage && <MainResumePlayer />}
        </main>
      </div>

      {/* Floating Glass Bottom Nav Dock with working interactive buttons */}
      {isAuthenticated && !isAuthPage && (
        <BottomNavDock onOpenSearch={() => setIsSearchOpen(true)} />
      )}

      {/* Global Interactive Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Global Fullscreen Cinema Live TV Player */}
      <LivePlayer />

      {/* Global Add M3U Modal */}
      <AddPlaylistModal
        isOpen={isAddPlaylistOpen}
        onClose={() => setIsAddPlaylistOpen(false)}
        onPlaylistAdded={() => {
          if (window.location.pathname === '/channels' || window.location.pathname === '/playlists') {
            window.location.reload();
          }
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <AppLayout />
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
