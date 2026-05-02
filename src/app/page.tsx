'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import BubbleMap from '@/components/BubbleMap';
import AccessibleListView from '@/components/AccessibleListView';
import { LayoutList, Map } from 'lucide-react';

export default function Home() {
  const { user, signInWithGoogle, logout } = useAuth();
  const [viewMode, setViewMode] = useState<'bubble' | 'list'>('bubble');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
              <span className="text-4xl">🫧</span>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Bubble Collab
            </h1>
            <p className="text-slate-400 mt-2">
              The gamified team collaboration platform.
            </p>
          </div>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-3 px-6 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex-none p-4 bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm">🫧</span>
          </div>
          <h1 className="text-xl font-bold">Bubble Collab</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-900/50 p-1 rounded-lg flex gap-1 border border-slate-700/50">
            <button
              onClick={() => setViewMode('bubble')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'bubble' 
                  ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              aria-label="Switch to Bubble Map View"
              aria-pressed={viewMode === 'bubble'}
            >
              <Map size={16} />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list' 
                  ? 'bg-indigo-500/20 text-indigo-400 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              aria-label="Switch to Accessible List View"
              aria-pressed={viewMode === 'list'}
            >
              <LayoutList size={16} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
          
          <div className="h-6 w-px bg-slate-700 mx-2"></div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300 font-medium">{user.displayName}</span>
            <button
              onClick={logout}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1.5 rounded-md transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'bubble' ? <BubbleMap /> : <AccessibleListView />}
      </main>
    </div>
  );
}
