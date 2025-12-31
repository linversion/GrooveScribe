import { Play, Square, Volume2, Mic2 } from 'lucide-react';
import { useDrumStore } from '../store/useDrumStore';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { RendererToggle } from './RendererToggle';

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
    <div className="flex items-center justify-between px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
      <div className="flex items-center gap-4">
        <Button
          onClick={togglePlay}
          variant={isPlaying ? "destructive" : "default"}
          size="icon"
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
        </Button>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            Groove Editor
            <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5">Alpha</Badge>
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
             <Mic2 size={12} className="opacity-70" />
             <span className="font-medium">Web Audio Synth</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 bg-muted/40 px-8 py-3 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">

        {/* BPM Control */}
        <div className="flex items-center gap-4 w-52">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-10">BPM</span>
          <div className="flex flex-col flex-1 gap-2">
             <span className="text-2xl font-mono font-bold text-center text-foreground tabular-nums tracking-tight">{bpm}</span>
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

        <div className="h-10 w-px bg-border" />

        {/* Volume/Output Mockup */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <Volume2 size={18} className="opacity-70" />
          <div className="w-28 h-2 bg-secondary rounded-full overflow-hidden shadow-inner">
            <div className="w-3/4 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse-subtle" />
          </div>
        </div>
      </div>

      {/* 渲染器切换按钮 */}
      <RendererToggle />
    </div>
  );
};
