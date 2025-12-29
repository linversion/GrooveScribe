import { useEffect, useRef } from 'react';
import { Play, Square, Volume2, Mic2 } from 'lucide-react';
import { useDrumStore } from '../store/useDrumStore';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

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
    <div className="flex items-center justify-between p-4 bg-background border-b border-border shadow-sm">
      <div className="flex items-center gap-4">
        <Button
          onClick={togglePlay}
          variant={isPlaying ? "destructive" : "default"}
          size="icon"
          className="rounded-full w-12 h-12 shadow-md"
        >
          {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
        </Button>
        
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            Groove Editor <Badge variant="outline" className="text-[10px] font-normal">Alpha</Badge>
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
             <Mic2 size={12} />
             <span>Web Audio Synth</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 bg-muted/30 px-6 py-2 rounded-lg border border-border/50">
        
        {/* BPM Control */}
        <div className="flex items-center gap-4 w-48">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-8">BPM</span>
          <div className="flex flex-col flex-1 gap-1">
             <span className="text-sm font-mono font-medium text-center">{bpm}</span>
             <Slider 
                value={[bpm]} 
                min={40} 
                max={200} 
                step={1} 
                onValueChange={(vals) => setBpm(vals[0])}
                className="cursor-pointer"
             />
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Volume/Output Mockup */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Volume2 size={16} />
          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-primary rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
