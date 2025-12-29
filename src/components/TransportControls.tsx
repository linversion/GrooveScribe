import { Play, Square, Volume2, Mic2 } from 'lucide-react';
import { useDrumStore } from '../store/useDrumStore';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

export const TransportControls = () => {
  const { isPlaying, setIsPlaying, bpm, setBpm } = useDrumStore();
  
  // 使用音频引擎 hook（自动处理 gridData 变化）
  const { play, stop } = useAudioEngine();

  const togglePlay = async () => {
    if (!isPlaying) {
      await play();
      setIsPlaying(true);
    } else {
      stop();
      setIsPlaying(false);
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
