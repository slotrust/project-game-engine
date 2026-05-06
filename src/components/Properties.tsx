import React from 'react';
import { useStore } from '../store';

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
                  value={Number(selectedObj.rotation.x).toFixed(2)}
                  onChange={e => handleChange('rotation', { ...selectedObj.rotation, x: parseFloat(e.target.value) })}
                  disabled={isPlayMode}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  step="0.1"
                />
              </div>
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Rot Y</span>
                <input 
                  type="number" 
                  value={Number(selectedObj.rotation.y).toFixed(2)}
                  onChange={e => handleChange('rotation', { ...selectedObj.rotation, y: parseFloat(e.target.value) })}
                  disabled={isPlayMode}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                  step="0.1"
                />
              </div>
              <div>
                <span className="text-xs text-zinc-500 block mb-1">Rot Z</span>
                <input 
                  type="number" 
                  value={Number(selectedObj.rotation.z).toFixed(2)}
                  onChange={e => handleChange('rotation', { ...selectedObj.rotation, z: parseFloat(e.target.value) })}
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
              </select>
            </div>

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
               <div>
                 <span className="text-xs text-zinc-500 block mb-1">Select Model Asset</span>
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

        <div className="space-y-2 flex flex-col h-64 flex-1">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex justify-between items-center">
            <span>Script (JS)</span>
            {isPlayMode && <span className="text-[10px] text-yellow-500 normal-case">Read-Only</span>}
          </label>
          <textarea
            value={selectedObj.script}
            onChange={e => handleChange('script', e.target.value)}
            disabled={isPlayMode}
            spellCheck={false}
            className="flex-1 w-full bg-[#1e1e1e] border border-zinc-800 rounded p-2 text-xs font-mono text-[#d4d4d4] focus:outline-none focus:border-[#00FF00] resize-none disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
