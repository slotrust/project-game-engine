import React, { useRef } from 'react';
import { useStore } from '../store';
import { Play, Pause, StepForward, Square, Settings, Layout, Undo2, Redo2, Plus, Download, Upload } from 'lucide-react';

export function Toolbar() {
  const { mode, setMode, scenes, activeSceneId, switchScene, addScene, undo, redo, past, future } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const data = JSON.stringify({ scenes }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.scenes) {
             useStore.setState({ scenes: parsed.scenes, activeSceneId: parsed.scenes[0].id, past: [], future: [] });
             console.log("Project loaded successfully!");
          }
        } catch(e) {
          console.error("Failed to load project:", e);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleStep = () => {
      window.dispatchEvent(new CustomEvent('engine-step-frame'));
  };

  return (
    <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 text-zinc-300">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-mono font-bold tracking-widest text-[#00FF00]">
          <Layout className="w-5 h-5" />
          NEXUS ENGINE
        </div>
        
        <div className="flex items-center gap-1 border-r border-zinc-800 pr-4 ml-2">
            <button title="Save Project" onClick={handleSave} className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <Download className="w-4 h-4" />
            </button>
            <button title="Load Project" onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <Upload className="w-4 h-4" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleLoad} className="hidden" accept=".json" />
        </div>

        <div className="flex items-center ml-2 gap-2">
          <select 
            value={activeSceneId}
            onChange={e => switchScene(e.target.value)}
            disabled={mode === 'play' || mode === 'pause'}
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
            disabled={mode === 'play' || mode === 'pause'}
            className="hover:text-white p-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 relative -left-10">
        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800 mr-2">
          <button 
            onClick={undo}
            disabled={mode === 'play' || mode === 'pause' || past.length === 0}
            className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button 
            onClick={redo}
            disabled={mode === 'play' || mode === 'pause' || future.length === 0}
            className="p-1.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          <button
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors \${
              mode === 'edit' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            onClick={() => setMode('edit')}
          >
            <Square className="w-4 h-4" /> 
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors \${
              mode === 'play' ? 'bg-zinc-800 text-[#00FF00]' : 'text-zinc-400 hover:text-[#00FF00]'
            }`}
            onClick={() => setMode('play')}
            title="Play"
          >
            <Play className="w-4 h-4" /> 
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors \${
              mode === 'pause' ? 'bg-zinc-800 text-yellow-400' : 'text-zinc-400 hover:text-yellow-400'
            }`}
            onClick={() => setMode('pause')}
            disabled={mode === 'edit'}
            title="Pause"
          >
            <Pause className="w-4 h-4" /> 
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors text-zinc-400 hover:text-blue-400 disabled:opacity-50`}
            onClick={handleStep}
            disabled={mode !== 'pause'}
            title="Step Frame"
          >
            <StepForward className="w-4 h-4" /> 
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
