import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import Editor from '@monaco-editor/react';

function AnimationTimelineScrubber({ objId }: { objId: string }) {
   const [progress, setProgress] = useState(0);
   const [duration, setDuration] = useState(1);
   const isDragging = useRef(false);

   useEffect(() => {
       let rafId: number;
       const loop = () => {
           rafId = requestAnimationFrame(loop);
           const state = (window as any).__engineAnimationState?.[objId];
           if (!isDragging.current && state) {
               setProgress(state.time);
               setDuration(state.duration);
           }
       };
       loop();
       return () => cancelAnimationFrame(rafId);
   }, [objId]);

   return (
       <div className="mt-2 text-xs text-zinc-500">
          <div className="flex justify-between mb-1">
             <span>{progress.toFixed(2)}s</span>
             <span>{duration.toFixed(2)}s</span>
          </div>
          <input 
              type="range" 
              min={0} 
              max={duration} 
              step={0.01} 
              value={progress} 
              onChange={e => {
                  const val = parseFloat(e.target.value);
                  setProgress(val);
                  window.dispatchEvent(new CustomEvent('engine-scrub-animation', { detail: { id: objId, time: val } }));
              }}
              onMouseDown={() => isDragging.current = true}
              onMouseUp={() => isDragging.current = false}
              className="w-full accent-zinc-500"
          />
       </div>
   );
}

export function Properties() {
  const { selectedId, updateObject, mode, assets } = useStore();
  const objects = useStore(s => s.scenes.find(sc => sc.id === s.activeSceneId)?.objects || []);
  const selectedObj = objects.find(o => o.id === selectedId);

  if (!selectedObj) {
    return (
      <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col h-full items-center justify-center text-zinc-600 text-sm">
        Select an object to inspect
      </div>
    );
  }

  const isPlayMode = mode === 'play';

  const handleChange = (field: keyof typeof selectedObj, value: any) => {
    updateObject(selectedObj.id, { [field]: value });
  };

  const handlePhysicsChange = (field: keyof typeof selectedObj.physics, value: any) => {
    if (!selectedObj.physics) return;
    updateObject(selectedObj.id, {
      physics: { ...selectedObj.physics, [field]: value }
    });
  };

  return (
    <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col h-full font-sans text-sm text-zinc-300">
      <div className="h-10 px-4 border-b border-zinc-800 flex items-center text-xs font-semibold tracking-wider text-zinc-400 uppercase">
        Properties {isPlayMode && <span className="ml-2 text-yellow-500 normal-case">(Read-Only)</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Transform</label>
          
          <div className="space-y-2">
            <div>
              <span className="text-xs text-zinc-500 block mb-1">Name</span>
              <input 
                type="text" 
                value={selectedObj.name}
                onChange={e => handleChange('name', e.target.value)}
                disabled={isPlayMode}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Pos X</span>
                <input 
                  type="number" 
                  value={Number(selectedObj.position.x).toFixed(2)}
                  onChange={e => handleChange('position', { ...selectedObj.position, x: parseFloat(e.target.value) })}
                  disabled={isPlayMode}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  step="0.1"
                />
              </div>
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Pos Y</span>
                <input 
                  type="number" 
                  value={Number(selectedObj.position.y).toFixed(2)}
                  onChange={e => handleChange('position', { ...selectedObj.position, y: parseFloat(e.target.value) })}
                  disabled={isPlayMode}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  step="0.1"
                />
              </div>
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Pos Z</span>
                <input 
                  type="number" 
                  value={Number(selectedObj.position.z).toFixed(2)}
                  onChange={e => handleChange('position', { ...selectedObj.position, z: parseFloat(e.target.value) })}
                  disabled={isPlayMode}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  step="0.1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Rot X</span>
                <input 
                  type="number" 
                  value={Number(selectedObj.rotation.x * 180 / Math.PI).toFixed(2)}
                  onChange={e => handleChange('rotation', { ...selectedObj.rotation, x: parseFloat(e.target.value) * Math.PI / 180 })}
                  disabled={isPlayMode}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  step="0.1"
                />
              </div>
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Rot Y</span>
                <input 
                  type="number" 
                  value={Number(selectedObj.rotation.y * 180 / Math.PI).toFixed(2)}
                  onChange={e => handleChange('rotation', { ...selectedObj.rotation, y: parseFloat(e.target.value) * Math.PI / 180 })}
                  disabled={isPlayMode}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  step="0.1"
                />
              </div>
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Rot Z</span>
                <input 
                  type="number" 
                  value={Number(selectedObj.rotation.z * 180 / Math.PI).toFixed(2)}
                  onChange={e => handleChange('rotation', { ...selectedObj.rotation, z: parseFloat(e.target.value) * Math.PI / 180 })}
                  disabled={isPlayMode}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  step="0.1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Scale X</span>
                <input 
                  type="number" 
                  value={Number(selectedObj.scale.x).toFixed(2)}
                  onChange={e => handleChange('scale', { ...selectedObj.scale, x: parseFloat(e.target.value) })}
                  disabled={isPlayMode}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  step="0.1"
                />
              </div>
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Scale Y</span>
                <input 
                  type="number" 
                  value={Number(selectedObj.scale.y).toFixed(2)}
                  onChange={e => handleChange('scale', { ...selectedObj.scale, y: parseFloat(e.target.value) })}
                  disabled={isPlayMode}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  step="0.1"
                />
              </div>
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Scale Z</span>
                <input 
                  type="number" 
                  value={Number(selectedObj.scale.z).toFixed(2)}
                  onChange={e => handleChange('scale', { ...selectedObj.scale, z: parseFloat(e.target.value) })}
                  disabled={isPlayMode}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block mb-1">Geometry</span>
              <select
                value={selectedObj.geometry}
                onChange={e => handleChange('geometry', e.target.value as any)}
                disabled={isPlayMode}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
              >
                <option value="box">Box</option>
                <option value="sphere">Sphere</option>
                <option value="plane">Plane</option>
                <option value="pointLight">Point Light</option>
                <option value="spotLight">Spot Light</option>
                <option value="model">3D Model (.glb, .obj)</option>
                <option value="group">Group</option>
                <option value="particles">Particles</option>
              </select>
            </div>

            {selectedObj.geometry === 'particles' && (
              <div className="space-y-2 border-t border-zinc-800 pt-3 mt-3">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Particles</div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Color</span>
                  <input 
                    type="color" 
                    value={selectedObj.particles?.color ?? selectedObj.color}
                    onChange={e => handleChange('particles', { ...selectedObj.particles!, color: e.target.value })}
                    className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Count</span>
                  <input
                    type="number"
                    value={selectedObj.particles?.count ?? 1000}
                    onChange={e => handleChange('particles', { ...selectedObj.particles!, count: parseInt(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Size</span>
                  <input
                    type="number" step="0.01"
                    value={selectedObj.particles?.size ?? 0.1}
                    onChange={e => handleChange('particles', { ...selectedObj.particles!, size: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Speed</span>
                  <input
                    type="number" step="0.1"
                    value={selectedObj.particles?.speed ?? 1}
                    onChange={e => handleChange('particles', { ...selectedObj.particles!, speed: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Spread</span>
                  <input
                    type="number" step="0.1"
                    value={selectedObj.particles?.spread ?? 5}
                    onChange={e => handleChange('particles', { ...selectedObj.particles!, spread: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            )}

            {selectedObj.geometry === 'model' && (
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Animation Name</span>
                  <input
                    type="text"
                    value={selectedObj.animation || ''}
                    onChange={e => handleChange('animation', e.target.value)}
                    placeholder="e.g. Idle, Run, Attack"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Animation Speed</span>
                  <input
                    type="number" step="0.1"
                    value={selectedObj.animationSpeed ?? 1}
                    onChange={e => handleChange('animationSpeed', parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div className="flex space-x-2 pt-1">
                   <button 
                      onClick={() => handleChange('animationPlaying', !(selectedObj.animationPlaying ?? true))}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-white flex-1"
                   >
                     {selectedObj.animationPlaying === false ? 'Play' : 'Pause'}
                   </button>
                   <button 
                      onClick={() => {
                        handleChange('animationRestart', Date.now());
                        handleChange('animationPlaying', true);
                      }}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-white"
                   >
                     Restart
                   </button>
                </div>
                <AnimationTimelineScrubber objId={selectedObj.id} />
              </div>
            )}

            {(selectedObj.geometry === 'pointLight' || selectedObj.geometry === 'spotLight') && (
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Color</span>
                  <input 
                    type="color" 
                    value={selectedObj.color}
                    onChange={e => handleChange('color', e.target.value)}
                    disabled={isPlayMode}
                    className="w-8 h-8 rounded shrink-0 bg-transparent cursor-pointer disabled:opacity-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-zinc-500 block mb-1">Intensity</span>
                    <input 
                      type="number" min="0" step="0.1"
                      value={selectedObj.lightProps?.intensity ?? 1}
                      onChange={e => handleChange('lightProps', { ...selectedObj.lightProps, intensity: parseFloat(e.target.value) })}
                      disabled={isPlayMode}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block mb-1">Distance (Range)</span>
                    <input 
                      type="number" min="0" step="1"
                      value={selectedObj.lightProps?.distance ?? 10}
                      onChange={e => handleChange('lightProps', { ...selectedObj.lightProps, distance: parseFloat(e.target.value) })}
                      disabled={isPlayMode}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                    />
                  </div>
                </div>
                {selectedObj.geometry === 'spotLight' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-zinc-500 block mb-1">Angle (rad)</span>
                      <input 
                        type="number" min="0" max="1.57" step="0.1"
                        value={selectedObj.lightProps?.angle ?? 0.5}
                        onChange={e => handleChange('lightProps', { ...selectedObj.lightProps, angle: parseFloat(e.target.value) })}
                        disabled={isPlayMode}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 block mb-1">Penumbra</span>
                      <input 
                        type="number" min="0" max="1" step="0.1"
                        value={selectedObj.lightProps?.penumbra ?? 0.5}
                        onChange={e => handleChange('lightProps', { ...selectedObj.lightProps, penumbra: parseFloat(e.target.value) })}
                        disabled={isPlayMode}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedObj.geometry === 'model' && (
              <div className="space-y-4">
               <div>
                 <span className="text-xs text-zinc-500 block mb-1">Base Model Asset</span>
                 <select
                   value={selectedObj.modelId || ''}
                   onChange={e => handleChange('modelId', e.target.value || undefined)}
                   disabled={isPlayMode}
                   className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                 >
                   <option value="">No Model Selected</option>
                   {assets.filter(a => a.type === 'model').map(a => (
                     <option key={a.id} value={a.id}>{a.name}</option>
                   ))}
                 </select>
               </div>
               
               <div className="space-y-2 border-t border-zinc-800 pt-3">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">LODs</span>
                    <button 
                       onClick={() => handleChange('lods', [...(selectedObj.lods || []), { distance: 10, modelId: '' }])}
                       className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] text-white"
                       disabled={isPlayMode}
                    >
                       Add LOD
                    </button>
                 </div>
                 {selectedObj.lods?.map((lod, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                       <input 
                         type="number" 
                         value={lod.distance} 
                         disabled={isPlayMode}
                         title="Distance from camera"
                         className="w-16 bg-zinc-900 border border-zinc-800 rounded px-1 py-1 text-xs focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                         onChange={(e) => {
                             const newLods = [...(selectedObj.lods || [])];
                             newLods[idx].distance = parseFloat(e.target.value);
                             handleChange('lods', newLods);
                         }}
                       />
                       <select
                         value={lod.modelId}
                         disabled={isPlayMode}
                         onChange={(e) => {
                             const newLods = [...(selectedObj.lods || [])];
                             newLods[idx].modelId = e.target.value;
                             handleChange('lods', newLods);
                         }}
                         className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded px-1 py-1 text-xs focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                       >
                         <option value="">Select Model</option>
                         {assets.filter(a => a.type === 'model').map(a => (
                           <option key={a.id} value={a.id}>{a.name}</option>
                         ))}
                       </select>
                       <button 
                         onClick={() => {
                             const newLods = [...(selectedObj.lods || [])];
                             newLods.splice(idx, 1);
                             handleChange('lods', newLods);
                         }}
                         className="text-red-500 hover:text-red-400 p-1"
                         disabled={isPlayMode}
                       >
                         &times;
                       </button>
                    </div>
                 ))}
               </div>
              </div>
            )}

            {selectedObj.geometry !== 'model' && selectedObj.geometry !== 'pointLight' && selectedObj.geometry !== 'spotLight' && (
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Color / Texture</span>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={selectedObj.color}
                      onChange={e => handleChange('color', e.target.value)}
                      disabled={isPlayMode}
                      className="w-8 h-8 rounded shrink-0 bg-transparent cursor-pointer disabled:opacity-50"
                    />
                    <select
                      value={selectedObj.spriteId || ''}
                      onChange={e => handleChange('spriteId', e.target.value || undefined)}
                      disabled={isPlayMode}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                    >
                      <option value="">No Texture (Color Only)</option>
                      {assets.filter(a => a.type === 'image' || a.type === 'hdr').map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-zinc-500 block mb-1">Metalness</span>
                    <input 
                      type="number" min="0" max="1" step="0.1"
                      value={selectedObj.metalness ?? 0}
                      onChange={e => handleChange('metalness', parseFloat(e.target.value))}
                      disabled={isPlayMode}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block mb-1">Roughness</span>
                    <input 
                      type="number" min="0" max="1" step="0.1"
                      value={selectedObj.roughness ?? 1}
                      onChange={e => handleChange('roughness', parseFloat(e.target.value))}
                      disabled={isPlayMode}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Physics</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedObj.physics?.enabled || false}
                onChange={e => handlePhysicsChange('enabled', e.target.checked)}
                disabled={isPlayMode}
                className="rounded bg-zinc-900 border-zinc-800"
              />
              <span className="text-sm">Enable Physics</span>
            </label>
            {selectedObj.physics?.enabled && (
              <>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedObj.physics?.isStatic || false}
                    onChange={e => handlePhysicsChange('isStatic', e.target.checked)}
                    disabled={isPlayMode}
                    className="rounded bg-zinc-900 border-zinc-800"
                  />
                  <span className="text-sm">Static (Unaffected by gravity/collisions)</span>
                </label>
                <div>
                  <span className="text-xs text-zinc-500 block mb-1">Collider Shape</span>
                  <select
                    value={selectedObj.physics?.colliderType || 'box'}
                    onChange={e => handlePhysicsChange('colliderType', e.target.value)}
                    disabled={isPlayMode}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  >
                    <option value="box">Box</option>
                    <option value="sphere">Sphere</option>
                    <option value="mesh">Convex Mesh</option>
                    <option value="hull">Convex Hull</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-zinc-500 block mb-1">Mass</span>
                    <input 
                      type="number" 
                      value={selectedObj.physics?.mass || 1}
                      onChange={e => handlePhysicsChange('mass', parseFloat(e.target.value))}
                      disabled={isPlayMode}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block mb-1">Bounciness</span>
                    <input 
                      type="number" 
                      step="0.1"
                      value={selectedObj.physics?.bounciness || 0}
                      onChange={e => handlePhysicsChange('bounciness', parseFloat(e.target.value))}
                      disabled={isPlayMode}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2 flex flex-col min-h-[300px] flex-1">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex justify-between items-center">
            <span>Script (JS)</span>
            {isPlayMode && <span className="text-[10px] text-yellow-500 normal-case">Read-Only</span>}
          </label>
          <div className="flex-1 w-full border border-zinc-800 rounded overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={selectedObj.script}
              onChange={value => handleChange('script', value || '')}
              options={{
                readOnly: isPlayMode,
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                formatOnPaste: true,
                padding: { top: 8, bottom: 8 }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
