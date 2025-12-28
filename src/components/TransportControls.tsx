import { useEffect, useRef } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';
import { useDrumStore } from '../store/useDrumStore';
import * as Tone from 'tone';
import { clsx } from 'clsx';

export const TransportControls = () => {
  const { isPlaying, setIsPlaying, bpm, setBpm, setCurrentStep, gridData, stepsPerMeasure, totalMeasures } = useDrumStore();
  
  // Tone.js Refs
  const seqRef = useRef<Tone.Sequence | null>(null);

  // Initialize Audio
  useEffect(() => {
    // 简单的合成器模拟鼓声
    const kickSynth = new Tone.MembraneSynth().toDestination();
    const snareSynth = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).toDestination();
    const metalSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
    
    // Low to High Tom simulation
    const tomLow = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4 }).toDestination();
    const tomHigh = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4 }).toDestination();

    // Loop
    const totalSteps = stepsPerMeasure * totalMeasures;
    const loop = new Tone.Sequence(
      (time, step) => {
        // Update UI Step
        Tone.Draw.schedule(() => {
          setCurrentStep(step);
        }, time);

        // Play Sounds
        if (gridData['kick'][step].active) kickSynth.triggerAttackRelease('C1', '8n', time, gridData['kick'][step].velocity / 127);
        if (gridData['snare'][step].active) snareSynth.triggerAttackRelease('8n', time, gridData['snare'][step].velocity / 127);
        if (gridData['hihat_closed'][step].active) metalSynth.triggerAttackRelease('32n', time, (gridData['hihat_closed'][step].velocity / 127) * 0.5);
        if (gridData['hihat_open'][step].active) metalSynth.triggerAttackRelease('8n', time, (gridData['hihat_open'][step].velocity / 127) * 0.8);
        if (gridData['tom_floor'][step].active) tomLow.triggerAttackRelease('G2', '8n', time, gridData['tom_floor'][step].velocity / 127);
        if (gridData['tom_high'][step].active) tomHigh.triggerAttackRelease('C3', '8n', time, gridData['tom_high'][step].velocity / 127);
        
      },
      Array.from({ length: totalSteps }, (_, i) => i),
      "16n"
    );

    seqRef.current = loop;

    return () => {
      loop.dispose();
      kickSynth.dispose();
      snareSynth.dispose();
      metalSynth.dispose();
      tomLow.dispose();
      tomHigh.dispose();
    };
  }, []); // Run once

  // Sync BPM
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const togglePlay = async () => {
    if (!isPlaying) {
      await Tone.start();
      Tone.Transport.start();
      seqRef.current?.start(0);
      setIsPlaying(true);
    } else {
      Tone.Transport.stop();
      seqRef.current?.stop();
      setIsPlaying(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="flex items-center gap-6 p-4 bg-cursor-bg border-b border-cursor-border">
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className={clsx(
            "w-10 h-10 flex items-center justify-center rounded-full transition-colors",
            isPlaying ? "bg-red-500 hover:bg-red-600 text-white" : "bg-cursor-accent hover:bg-blue-600 text-white"
          )}
        >
          {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>

      <div className="flex items-center gap-3 bg-cursor-input px-3 py-1.5 rounded-md border border-cursor-border">
        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">BPM</span>
        <input 
          type="number" 
          value={bpm} 
          onChange={(e) => setBpm(Number(e.target.value))}
          className="bg-transparent w-12 text-center text-sm focus:outline-none"
        />
      </div>

      <div className="h-6 w-px bg-cursor-border mx-2" />

      <div className="flex items-center gap-2 text-gray-400">
        <Volume2 size={16} />
        <div className="w-24 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div className="w-3/4 h-full bg-cursor-accent" />
        </div>
      </div>
    </div>
  );
};
