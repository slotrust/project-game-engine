import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { executeSceneCommand } from '../lib/gemini';
import { Send, Bot, User, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';

export function AIAssistant() {
  const store = useStore();
  const { mode, activeSceneId, scenes, addObject, updateObject, deleteObject, updateSceneConfig, addAsset } = store;
  const activeScene = scenes.find(sc => sc.id === activeSceneId);
  const objects = activeScene?.objects || [];
  
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai' | 'system', text: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || isGenerating) return;

    if (!process.env.GEMINI_API_KEY) {
      setMessages(p => [...p, { role: 'system', text: 'Error: Cannot find GEMINI_API_KEY. Set it in the environment variables.' }]);
      return;
    }

    const currentPrompt = prompt;
    setPrompt('');
    setMessages(prev => [...prev, { role: 'user', text: currentPrompt }]);
    setIsGenerating(true);

    try {
      const sceneState = {
        config: activeScene?.config,
        objects: objects.map(o => ({
          id: o.id,
          name: o.name,
          geometry: o.geometry,
          position: o.position,
          color: o.color,
          script: o.script
        }))
      };

      const result = await executeSceneCommand(currentPrompt, sceneState);
      
      if (result.commands && Array.isArray(result.commands)) {
        let addedCount = 0;
        let updatedCount = 0;
        for (const cmd of result.commands) {
          if (cmd.type === 'addAsset' && cmd.data) {
            addAsset(cmd.data);
          } else if (cmd.type === 'add' && cmd.data) {
            addObject(cmd.data);
            addedCount++;
          } else if (cmd.type === 'update' && cmd.id && cmd.data) {
            updateObject(cmd.id, cmd.data);
            updatedCount++;
          } else if (cmd.type === 'delete' && cmd.id) {
            deleteObject(cmd.id);
          } else if (cmd.type === 'updateConfig' && cmd.data) {
            updateSceneConfig(cmd.data);
          }
        }
      }

      setMessages(prev => [...prev, { role: 'ai', text: result.message || 'Done.' }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'system', text: 'Error generating code: ' + err.message }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-64 border-t border-zinc-800 bg-zinc-950 flex flex-col relative w-full font-sans">
      {mode === 'play' && (
        <div className="absolute inset-0 bg-zinc-950/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
          <AlertCircle className="w-8 h-8 text-yellow-500 mb-2" />
          <span className="text-sm font-medium text-zinc-300">AI agent is disabled while playing</span>
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-zinc-500 text-sm italic">
            Ask me to add objects, change lighting, or write behaviors...
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 text-sm ${m.role === 'user' ? 'opacity-80' : ''}`}>
            {m.role === 'user' ? <User className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" /> : 
             m.role === 'system' ? <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /> :
             <Bot className="w-5 h-5 text-[#00FF00] shrink-0 mt-0.5" />}
            
            <div className="flex-1 min-w-0 pr-4 text-zinc-300">
              {m.role === 'user' ? (
                <p>{m.text}</p>
              ) : (
                <div className="markdown-body prose prose-invert prose-sm max-w-none prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-zinc-800 prose-pre:p-3">
                  <Markdown>{m.text}</Markdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex gap-3 text-sm animate-pulse text-zinc-500">
            <Bot className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
            <p>Analyzing scene and executing...</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={isGenerating || mode === 'play'}
            placeholder="E.g., Make the background blue, add a green sphere, make the ground rotate..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00FF00] transition-colors text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating || mode === 'play'}
            className="bg-zinc-800 hover:bg-[#00FF00] hover:text-black text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
