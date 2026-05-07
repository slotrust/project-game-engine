import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { GameObject, AnimState, AnimTransition, AnimationProps } from '../types';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { X, Play, Pause } from 'lucide-react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Node, 
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as THREE from 'three';

const ResizeHandle = () => (
  <PanelResizeHandle className="relative flex items-center justify-center bg-zinc-900 w-1 cursor-col-resize hover:bg-zinc-700 transition-colors delay-100">
    <div className="h-4 w-[2px] bg-zinc-700 rounded-full" />
  </PanelResizeHandle>
);

export function AnimationEditor({ onClose }: { onClose: () => void }) {
  const selectedId = useStore(s => s.selectedId);
  const objects = useStore(s => s.scenes.find(sc => sc.id === s.activeSceneId)?.objects) || [];
  const selectedObject = objects.find(o => o.id === selectedId);
  const updateObject = useStore(s => s.updateObject);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (selectedObject?.animation?.graph) {
      const graph = selectedObject.animation.graph;
      setNodes(graph.states.map(s => ({
        id: s.id,
        position: s.position || { x: 100, y: 100 },
        data: { label: s.name },
        type: 'default'
      })));
      setEdges(graph.transitions.map(t => ({
        id: t.id,
        source: t.fromStateId,
        target: t.toStateId,
        label: t.condition,
        animated: true,
      })));
    }
  }, [selectedObject?.id]);

  if (!selectedObject) {
    return (
      <div className="absolute inset-0 bg-zinc-950 z-50 flex items-center justify-center text-zinc-500">
        <div className="text-center">
          <p>No object selected.</p>
          <button className="mt-4 px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700 text-white" onClick={onClose}>Close Editor</button>
        </div>
      </div>
    );
  }

  const onNodesChange = (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds));
  const onConnect = (params: Connection) => setEdges((eds) => addEdge(params, eds));

  // Save changes back to object
  const saveGraph = () => {
    const states = nodes.map(n => {
       const existing = selectedObject.animation?.graph?.states.find(s => s.id === n.id);
       return {
         ...existing,
         id: n.id,
         name: n.data.label as string,
         position: n.position,
         speed: existing?.speed ?? 1,
         loop: existing?.loop ?? true,
         rootMotion: existing?.rootMotion ?? false,
         type: existing?.type ?? 'clip',
       } as AnimState;
    });
    
    const transitions = edges.map(e => ({
       id: e.id,
       fromStateId: e.source,
       toStateId: e.target,
       condition: (e.label as string) || 'true',
       duration: 0.2
    }));

    updateObject(selectedObject.id, {
      animation: {
        ...selectedObject.animation,
        enabled: true,
        graph: {
           states,
           transitions,
           initialStateId: states[0]?.id || '',
           parameters: selectedObject.animation?.graph?.parameters || {}
        }
      }
    });
  };

  return (
    <div className="h-full bg-zinc-950 flex flex-col font-sans">
      {/* Header */}
      <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900">
        <h2 className="text-white font-medium flex items-center gap-2">
          Animation Graph Editor: <span className="text-emerald-400">{selectedObject.name}</span>
        </h2>
        <div className="flex gap-2">
           <button onClick={saveGraph} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors">
              Save Graph
           </button>
           <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
             <X size={20} />
           </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        <PanelGroup orientation="horizontal">
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full bg-zinc-900 border-r border-zinc-800 p-4 overflow-y-auto">
               <h3 className="text-zinc-400 text-xs font-bold uppercase mb-4 tracking-wider">Animation State Node</h3>
               {/* Selected node properties could go here */}
               <div className="text-zinc-500 text-sm">Select a node in the graph to edit its properties.</div>
               <button className="mt-4 px-3 py-1.5 w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm transition-colors border border-zinc-700"
                  onClick={() => {
                     setNodes([...nodes, { id: Math.random().toString(36).substr(2, 9), position: { x: 200, y: 200 }, data: { label: 'New State' }, type: 'default'}])
                  }}
               >
                 + Add State
               </button>
            </div>
          </Panel>
          <ResizeHandle />
          <Panel defaultSize={80}>
             <ReactFlow
               nodes={nodes}
               edges={edges}
               onNodesChange={onNodesChange}
               onEdgesChange={onEdgesChange}
               onConnect={onConnect}
               fitView
               className="bg-zinc-950"
               colorMode="dark"
             >
               <Background color="#3f3f46" gap={16} />
               <Controls className="bg-zinc-800 fill-white text-white border-zinc-700" />
             </ReactFlow>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
