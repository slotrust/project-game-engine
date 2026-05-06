import React from 'react';
import { useStore } from '../store';
import { Play, Square, Settings, Layout, Undo2, Redo2, Plus } from 'lucide-react';

export function Toolbar() {
  const { mode, setMode, scenes, activeSceneId, switchScene, addScene, undo, redo, past, future } = useStore();

  return (
    <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 text-zinc-300">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-mono font-bold tracking-widest text-[#00FF00]">
          <Layout className="w-5 h-5" />
          NEXUS ENGINE
        </div>
        
        <div className="flex items-center ml-4 gap-2">
          <select 
            value={activeSceneId}
            onChange={e => switchScene(e.target.value)}
            disabled={mode === 'play'}
            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
          >
            {scenes.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button 
            onClick={() => {
              const name = prompt('Scene Name:');
              if (name) addScene(name);
            }}
            disabled={mode === 'play'}
            className="hover:text-white p-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800 mr-2">
          <button 
            onClick={undo}
            disabled={mode === 'play' || past.length === 0}
            className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button 
            onClick={redo}
            disabled={mode === 'play' || future.length === 0}
            className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'edit' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            onClick={() => setMode('edit')}
          >
            <Square className="w-4 h-4" /> Edit
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'play' ? 'bg-[#00FF00] text-black shadow-[0_0_10px_rgba(0,255,0,0.3)]' : 'text-zinc-400 hover:text-[#00FF00]'
            }`}
            onClick={() => setMode('play')}
          >
            <Play className="w-4 h-4" /> Play
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-3 text-zinc-500">
        <button className="hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
