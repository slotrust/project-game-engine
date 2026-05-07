import React, { useState, useEffect } from 'react';
import { Terminal, AlertTriangle, XCircle, Info } from 'lucide-react';

interface LogMessage {
  id: string;
  type: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

export function ConsolePanel() {
  const [logs, setLogs] = useState<LogMessage[]>([]);

  useEffect(() => {
    // Intercept console.log, warn, error for the in-editor console
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (type: 'info' | 'warn' | 'error', args: any[]) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      setLogs(prev => [...prev, { id: Math.random().toString(), type, message, timestamp: new Date() }]);
    };

    console.log = (...args) => { addLog('info', args); originalLog(...args); };
    console.warn = (...args) => { addLog('warn', args); originalWarn(...args); };
    console.error = (...args) => { addLog('error', args); originalError(...args); };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-t border-zinc-800 font-mono text-sm">
      <div className="flex items-center gap-4 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <button className="pb-1 border-b-2 border-[#00FF00] text-[#00FF00] flex items-center gap-2">
          <Terminal className="w-4 h-4" /> Output Log
        </button>
        <div className="flex-1" />
        <button className="text-[10px] text-zinc-500 hover:text-white" onClick={() => setLogs([])}>Clear</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[#0a0a0a]">
        {logs.length === 0 && <div className="text-zinc-600 text-xs py-2 px-2">No output logs.</div>}
        {logs.map(log => (
          <div key={log.id} className="flex items-start gap-2 text-xs py-1 px-2 hover:bg-zinc-900 border-b border-zinc-800/50">
            <span className="text-zinc-600 min-w-[70px] shrink-0">
              {log.timestamp.toLocaleTimeString([], { hour12: false })}
            </span>
            {log.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />}
            {log.type === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />}
            {log.type === 'error' && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />}
            <span className={`break-all ${
              log.type === 'info' ? 'text-zinc-300' : 
              log.type === 'warn' ? 'text-yellow-400' : 
              'text-red-500'
            }`}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
