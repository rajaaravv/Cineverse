import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Sparkles, Tv, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onOpenAddPlaylist: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAddPlaylist }) => {
  const { isAuthenticated, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/channels');
    } else {
      loginAsDemo();
      navigate('/channels');
    }
  };

  // Curated poster collage items matching Screen 1
  const posters = [
    { title: 'Wednesday', img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80' },
    { title: 'Wicked', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80' },
    { title: 'Scream 7', img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80' },
    { title: 'Marvel Zombies', img: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80' },
    { title: 'Avengers', img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80' },
    { title: 'Stab 9', img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=80' },
    { title: 'Predator Badlands', img: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500&auto=format&fit=crop&q=80' },
    { title: 'Turok Origins', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80' },
    { title: 'Mulan', img: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="relative min-h-[calc(100vh-6rem)] flex flex-col justify-between overflow-hidden pb-12 font-sans">
      {/* 3D Tilted Movie Poster Collage Grid */}
      <div className="relative w-full h-[440px] md:h-[500px] overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/80 via-transparent to-transparent pointer-events-none" />

        {/* Angled Poster Grid */}
        <div className="poster-collage-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3.5 p-4 opacity-50">
          {posters.map((p, idx) => (
            <div
              key={idx}
              className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-sm border border-border transform transition duration-300 hover:scale-105"
            >
              <img
                src={p.img}
                alt={p.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent flex items-end p-2.5">
                <span className="text-[11px] font-medium text-foreground truncate drop-shadow">{p.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vercel Bottom Card */}
      <div className="relative z-20 mx-auto w-full max-w-xl px-4 sm:px-6 -mt-20">
        <div className="rounded-lg bg-card p-7 sm:p-9 shadow-sm border border-border text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-md bg-secondary border border-border px-3.5 py-1 text-xs font-mono text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Welcome to Cineverse</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
            Your Entertainment <br />
            <span className="text-muted-foreground">
              Starts Right Here
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Discover movies, series, sports, and live channels. Stream anytime, anywhere effortlessly.
          </p>

          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleGetStarted}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition transform active:scale-[0.99]"
            >
              <Play className="h-4 w-4 fill-current ml-0.5" />
              <span>Get Started</span>
            </button>

            {!isAuthenticated ? (
              <Link
                to="/login"
                className="w-full flex items-center justify-center rounded-lg bg-secondary border border-border py-3 text-sm font-medium text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition"
              >
                <span>Sign In</span>
              </Link>
            ) : (
              <button
                onClick={onOpenAddPlaylist}
                className="w-full flex items-center justify-center rounded-lg bg-secondary border border-border py-3 text-sm font-medium text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition"
              >
                <span>Import Custom M3U Playlist</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-foreground" />
              <span>Zero Latency HLS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tv className="h-3.5 w-3.5 text-foreground" />
              <span>Public IPTV</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-foreground" />
              <span>Cloud Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
