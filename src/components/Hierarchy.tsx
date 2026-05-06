import React, { useState } from 'react';
import { useStore } from '../store';
import { Box, Plus, Trash2, Folder, Image as ImageIcon, Music } from 'lucide-react';

export function Hierarchy() {
  const { mode, selectedId, selectObject, addObject, deleteObject, addAsset, deleteAsset, assets } = useStore();
  const scene = useStore(s => s.scenes.find(sc => sc.id === s.activeSceneId));
  const objects = scene?.objects || [];
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'assets' | 'scene'>('hierarchy');

  return (
    <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full font-sans text-sm">
      <div className="flex border-b border-zinc-800 bg-zinc-900 overflow-hidden">
        <button 
          className={`flex-1 py-2 text-[10px] font-semibold tracking-wider uppercase transition-colors ${activeTab === 'hierarchy' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
          onClick={() => setActiveTab('hierarchy')}
        >
          Objects
        </button>
        <button 
          className={`flex-1 py-2 text-[10px] font-semibold tracking-wider uppercase transition-colors ${activeTab === 'scene' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
          onClick={() => setActiveTab('scene')}
        >
          Scene
        </button>
        <button 
          className={`flex-1 py-2 text-[10px] font-semibold tracking-wider uppercase transition-colors ${activeTab === 'assets' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
          onClick={() => setActiveTab('assets')}
        >
          Assets
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'hierarchy' && (
          <>
            <div className="flex flex-row justify-between w-full mb-3 pb-1 border-b border-zinc-800">
               <span className="text-zinc-500 text-xs">Scene Objects</span>
               <button 
                  onClick={() => addObject({})} 
                  disabled={mode === 'play'}
                  className="hover:text-white disabled:opacity-50 text-zinc-400"
                  title="Add GameObject"
                >
                  <Plus className="w-4 h-4" />
                </button>
            </div>
            {objects.map(obj => (
              <div 
                key={obj.id}
                onClick={() => selectObject(obj.id)}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  selectedId === obj.id 
                    ? 'bg-zinc-800 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4" style={{ color: obj.color }} />
                  <span className="truncate">{obj.name}</span>
                </div>

                {mode === 'edit' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteObject(obj.id); }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-zinc-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {objects.length === 0 && (
              <div className="text-zinc-600 px-2 py-4 text-center text-xs">
                No objects in scene.
              </div>
            )}
          </>
        )}

        {activeTab === 'scene' && scene && (
          <div className="p-4 space-y-4">
             <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Lighting</div>
             
             <div className="space-y-2">
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Ambient Color</span>
                  <input 
                    type="color" 
                    value={scene.config.ambientLightColor}
                    onChange={e => useStore.getState().updateSceneConfig({ ambientLightColor: e.target.value })}
                    className="w-full h-8 bg-transparent cursor-pointer rounded"
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Ambient Intensity</span>
                  <input 
                    type="range" min="0" max="2" step="0.1"
                    value={scene.config.ambientLightIntensity}
                    onChange={e => useStore.getState().updateSceneConfig({ ambientLightIntensity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="mt-4">
                  <span className="text-xs text-zinc-500 block mb-1">Directional Color</span>
                  <input 
                    type="color" 
                    value={scene.config.directionalLightColor}
                    onChange={e => useStore.getState().updateSceneConfig({ directionalLightColor: e.target.value })}
                    className="w-full h-8 bg-transparent cursor-pointer rounded"
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Directional Intensity</span>
                  <input 
                    type="range" min="0" max="2" step="0.1"
                    value={scene.config.directionalLightIntensity}
                    onChange={e => useStore.getState().updateSceneConfig({ directionalLightIntensity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
             </div>

             <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-6">Environment</div>
             <div>
                <span className="text-xs text-zinc-500 block mb-1">Skybox / HDRi Asset</span>
                <select
                  value={scene.config.skyboxUrl || ''}
                  onChange={e => useStore.getState().updateSceneConfig({ skyboxUrl: e.target.value || undefined })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600"
                >
                  <option value="">None (Solid Background)</option>
                  {assets.filter(a => a.type === 'image' || a.type === 'hdr').map(a => (
                    <option key={a.id} value={a.url}>{a.name}</option>
                  ))}
                </select>
             </div>

             <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-6">Post Processing</div>
             <div className="space-y-3">
               <div>
                 <label className="flex items-center gap-2 text-xs text-zinc-300">
                   <input
                     type="checkbox"
                     checked={scene.config.bloomEnabled ?? true}
                     onChange={e => useStore.getState().updateSceneConfig({ bloomEnabled: e.target.checked })}
                     className="rounded border-zinc-800 bg-zinc-900"
                   />
                   Enable Bloom
                 </label>
               </div>
               <div>
                  <span className="text-xs text-zinc-500 block mb-1">Bloom Intensity</span>
                  <input 
                    type="range" min="0" max="3" step="0.1"
                    value={scene.config.bloomIntensity ?? 0.5}
                    onChange={e => useStore.getState().updateSceneConfig({ bloomIntensity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Bloom Threshold</span>
                  <input 
                    type="range" min="0" max="1" step="0.1"
                    value={scene.config.bloomThreshold ?? 0.8}
                    onChange={e => useStore.getState().updateSceneConfig({ bloomThreshold: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Bloom Radius</span>
                  <input 
                    type="range" min="0" max="1" step="0.1"
                    value={scene.config.bloomRadius ?? 0.2}
                    onChange={e => useStore.getState().updateSceneConfig({ bloomRadius: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
             </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <>
            <div className="flex flex-row justify-between w-full mb-3 pb-1 border-b border-zinc-800">
               <span className="text-zinc-500 text-xs">Project Assets</span>
                 <div className="flex gap-1">
                 <button 
                    onClick={() => {
                      const url = prompt('Image/HDR URL:');
                      if (url) {
                         const isHdr = url.toLowerCase().endsWith('.hdr');
                         addAsset({ name: isHdr ? 'New HDRI' : 'New Image', type: isHdr ? 'hdr' : 'image', url });
                      }
                    }} 
                    className="hover:text-white text-zinc-400"
                    title="Add Image or HDRI Asset"
                  >
                    <Plus className="w-3 h-3" /> Img/HDR
                  </button>
                  <button 
                    onClick={() => {
                      const url = prompt('Audio URL (.mp3, .wav):');
                      if (url) addAsset({ name: 'New Audio', type: 'sound', url });
                    }} 
                    className="hover:text-white text-zinc-400"
                    title="Add Audio Asset"
                  >
                    <Plus className="w-3 h-3" /> Snd
                  </button>
                  <button 
                    onClick={() => {
                      const url = prompt('3D Model URL (.glb):');
                      if (url) addAsset({ name: 'New Model', type: 'model', url });
                    }} 
                    className="hover:text-white text-zinc-400"
                    title="Add Model Asset"
                  >
                    <Plus className="w-3 h-3" /> 3D
                  </button>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {assets.map(asset => (
                <div key={asset.id} className="bg-zinc-900 border border-zinc-800 rounded p-2 flex flex-col items-center gap-2 group relative">
                  {asset.type === 'image' || asset.type === 'hdr' ? (
                    <img src={asset.url} alt={asset.name} className="w-12 h-12 object-contain bg-zinc-950 rounded" />
                  ) : asset.type === 'model' ? (
                    <div className="w-12 h-12 flex items-center justify-center bg-zinc-950 rounded">
                      <Box className="w-6 h-6 text-zinc-500" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-zinc-950 rounded">
                      <Music className="w-6 h-6 text-zinc-500" />
                    </div>
                  )}
                  <span className="text-[10px] text-zinc-400 text-center truncate w-full">{asset.name}</span>
                </div>
              ))}
            </div>
            {assets.length === 0 && (
              <div className="text-zinc-600 px-2 py-4 text-center text-xs">
                No assets.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
