import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { File, Folder, Image as ImageIcon, Box, FileText, Music, Upload } from 'lucide-react';
import { Asset } from '../types';

export function ContentBrowser() {
  const { assets, addAsset } = useStore();
  const [activeTab, setActiveTab] = useState('assets');
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files: File[]) => {
      files.forEach(file => {
          const extension = file.name.split('.').pop()?.toLowerCase();
          let type: Asset['type'] = 'image';
          if (extension === 'glb' || extension === 'gltf' || extension === 'obj') type = 'model';
          else if (extension === 'hdr') type = 'hdr';
          else if (extension === 'mp3' || extension === 'wav' || extension === 'ogg') type = 'sound';
          
          const url = URL.createObjectURL(file);
          addAsset({ name: file.name, type, url });
      });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          handleFiles(Array.from(e.target.files));
      }
  };

  return (
    <div 
      className="flex flex-col h-full bg-zinc-950 border-t border-zinc-800 font-mono text-sm relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileInput} />
      
      {isHovering && (
        <div className="absolute inset-0 bg-[#00FF00]/10 border-2 border-dashed border-[#00FF00] z-50 flex items-center justify-center pointer-events-none">
           <span className="text-[#00FF00] font-bold tracking-widest text-lg bg-zinc-950/80 px-4 py-2 rounded">DROP ASSETS HERE</span>
        </div>
      )}

      <div className="flex items-center gap-4 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <button 
          className={`pb-1 border-b-2 \${activeTab === 'assets' ? 'border-[#00FF00] text-[#00FF00]' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          onClick={() => setActiveTab('assets')}
        >
          Content Browser
        </button>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-zinc-800 p-2 overflow-y-auto hidden md:block">
          <div className="flex items-center gap-2 text-zinc-300 py-1 px-2 hover:bg-zinc-800 rounded cursor-pointer">
            <Folder className="w-4 h-4 text-yellow-500" />
            <span>Content</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 py-1 px-2 ml-4 hover:bg-zinc-800 rounded cursor-pointer">
            <Folder className="w-4 h-4" />
            <span>Meshes</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 py-1 px-2 ml-4 hover:bg-zinc-800 rounded cursor-pointer">
            <Folder className="w-4 h-4" />
            <span>Textures</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 py-1 px-2 ml-4 hover:bg-zinc-800 rounded cursor-pointer">
            <Folder className="w-4 h-4" />
            <span>Audio</span>
          </div>
        </div>

        {/* Assets Viewer */}
        <div className="flex-1 p-4 grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-4 overflow-y-auto content-start">
          {assets.map(asset => (
            <div 
                key={asset.id} 
                className="flex flex-col items-center gap-2 p-2 hover:bg-zinc-800 rounded cursor-pointer group"
                draggable={asset.type === 'prefab' || asset.type === 'model'}
                onDragStart={(e) => {
                    if (asset.type === 'prefab' && asset.data) {
                        e.dataTransfer.setData('engine-prefab', JSON.stringify(asset.data));
                    } else if (asset.type === 'model') {
                        e.dataTransfer.setData('engine-model', JSON.stringify({ id: asset.id, name: asset.name, url: asset.url }));
                    }
                }}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-zinc-900 rounded border border-zinc-700 group-hover:border-[#00FF00]">
                {asset.type === 'image' && <ImageIcon className="w-6 h-6 text-blue-400" />}
                {asset.type === 'sound' && <Music className="w-6 h-6 text-purple-400" />}
                {asset.type === 'hdr' && <ImageIcon className="w-6 h-6 text-orange-400" />}
                {asset.type === 'model' && <Box className="w-6 h-6 text-green-400" />}
                {asset.type === 'prefab' && <Box className="w-6 h-6 text-yellow-400" />}
              </div>
              <span className="text-[10px] text-zinc-400 text-center truncate w-full break-all" title={asset.name}>{asset.name}</span>
            </div>
          ))}
          
          <div 
             className="flex flex-col items-center gap-2 p-2 hover:bg-zinc-800 rounded cursor-pointer group border border-dashed border-zinc-800"
             onClick={() => fileInputRef.current?.click()}
          >
             <div className="w-12 h-12 flex items-center justify-center rounded">
                <Upload className="w-6 h-6 text-zinc-500 group-hover:text-[#00FF00]" />
             </div>
             <span className="text-[10px] text-zinc-500 group-hover:text-[#00FF00]">Import</span>
          </div>
        </div>
      </div>
    </div>
  );
}
