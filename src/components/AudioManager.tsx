import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';

export function AudioManager() {
  const { assets, mode } = useStore();
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    // Diff assets and create audio elements
    const soundAssets = assets.filter(a => a.type === 'sound');
    
    soundAssets.forEach(asset => {
      if (!audioRefs.current[asset.id]) {
        const audio = new Audio(asset.url);
        audio.loop = true; // Auto loop for BGM for now
        audioRefs.current[asset.id] = audio;
      }
    });

    // Clean up deleted assets
    Object.keys(audioRefs.current).forEach(id => {
      if (!soundAssets.find(a => a.id === id)) {
        audioRefs.current[id].pause();
        audioRefs.current[id].src = '';
        delete audioRefs.current[id];
      }
    });
  }, [assets]);

  useEffect(() => {
    if (mode === 'play') {
      // Play all sounds
      Object.values(audioRefs.current).forEach(audio => {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio autoplay prevented'));
      });
    } else {
      // Stop all sounds
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
      });
    }
  }, [mode]);

  return null;
}
