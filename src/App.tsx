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

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-white selection:bg-[#00FF00] selection:text-black">
      <Toolbar />
      <AudioManager />
      <div className="flex flex-1 overflow-hidden relative">
        <Hierarchy />
        <div className="flex flex-col flex-1 relative min-w-0">
          <Viewport />
          <AIAssistant />
        </div>
        <Properties />
      </div>
    </div>
  );
}
