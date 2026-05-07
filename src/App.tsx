/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Toolbar } from './components/Toolbar';
import { Hierarchy } from './components/Hierarchy';
import { Properties } from './components/Properties';
import { AIAssistant } from './components/AIAssistant';
import { Viewport } from './components/Viewport';
import { AudioManager } from './components/AudioManager';
import { ContentBrowser } from './components/ContentBrowser';
import { ConsolePanel } from './components/ConsolePanel';
import { AnimationEditor } from './components/AnimationEditor';
import { useStore } from './store';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import React, { useState, useEffect } from 'react';

// Custom Resize Handle
const ResizeHandle = ({ direction = "vertical" }: { direction?: "vertical" | "horizontal" }) => (
  <PanelResizeHandle className={`relative flex items-center justify-center bg-zinc-900 \${direction === 'horizontal' ? 'w-1 cursor-col-resize hover:bg-zinc-700' : 'h-1 cursor-row-resize hover:bg-zinc-700'} transition-colors delay-100`}>
    <div className={`\${direction === 'horizontal' ? 'h-4 w-[2px]' : 'w-4 h-[2px]'} bg-zinc-700 rounded-full`} />
  </PanelResizeHandle>
);

export default function App() {
  const bottomTab = useStore(s => s.bottomTab);
  const setBottomTab = useStore(s => s.setBottomTab);
  const showAnimationEditor = useStore(s => s.showAnimationEditor);
  const setShowAnimationEditor = useStore(s => s.setShowAnimationEditor);

  useEffect(() => {
    // Initializer space
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-white selection:bg-[#00FF00] selection:text-black">
      <Toolbar />
      <AudioManager />
      
      <div className="flex flex-1 overflow-hidden relative">
        <PanelGroup orientation="horizontal">
          {/* Left Panel: Hierarchy */}
          <Panel defaultSize={15} minSize={10}>
            <Hierarchy />
          </Panel>
          
          <ResizeHandle direction="horizontal" />

          {/* Middle Panel: Viewport + Bottom Area */}
          <Panel defaultSize={65} minSize={30}>
            <PanelGroup orientation="vertical">
              {/* Viewport */}
              <Panel defaultSize={70} minSize={20}>
                <div className="flex flex-col h-full relative min-w-0">
                  <Viewport />
                  <AIAssistant />
                </div>
              </Panel>

              <ResizeHandle direction="vertical" />

              {/* Bottom Area */}
              <Panel defaultSize={30} minSize={10}>
                <div className="h-full flex flex-col bg-zinc-950">
                  {/* Tab Selector */}
                  <div className="flex bg-zinc-900 border-b border-zinc-800 px-2 pt-1 font-mono text-xs overflow-x-auto whitespace-nowrap">
                    <button 
                      className={`px-4 py-1.5 rounded-t-lg transition-colors \${bottomTab === 'content' ? 'bg-zinc-800 text-white border-t border-l border-r border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                      onClick={() => setBottomTab('content')}
                    >
                      Content Browser
                    </button>
                    <button 
                      className={`px-4 py-1.5 rounded-t-lg transition-colors ml-1 \${bottomTab === 'console' ? 'bg-zinc-800 text-white border-t border-l border-r border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                      onClick={() => setBottomTab('console')}
                    >
                      Output Log
                    </button>
                    {showAnimationEditor && (
                      <button 
                        className={`px-4 py-1.5 rounded-t-lg transition-colors ml-1 \${bottomTab === 'animation' as any ? 'bg-emerald-800 text-white border-t border-l border-r border-emerald-700' : 'text-emerald-500 hover:text-emerald-300 bg-emerald-900/30'}`}
                        onClick={() => setBottomTab('animation' as any)}
                      >
                        Animation Graph Editor (Active)
                        <span onClick={(e) => { e.stopPropagation(); setShowAnimationEditor(false); if (bottomTab==='animation' as any) setBottomTab('content'); }} className="ml-2 hover:text-white">&times;</span>
                      </button>
                    )}
                  </div>
                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden">
                    {bottomTab === 'content' && <ContentBrowser />}
                    {bottomTab === 'console' && <ConsolePanel />}
                    {bottomTab === 'animation' as any && <AnimationEditor onClose={() => { setShowAnimationEditor(false); setBottomTab('content'); }} />}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <ResizeHandle direction="horizontal" />

          {/* Right Panel: Properties */}
          <Panel defaultSize={20} minSize={15}>
            <Properties />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
