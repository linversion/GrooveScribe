import { Play, Square, Volume2, Mic2, Loader2 } from 'lucide-react';
import { useDrumStore } from '../store/useDrumStore';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { RendererToggle } from './RendererToggle';
import { AudioModeToggle } from './AudioModeToggle';

export const TransportControls = () => {
  const { isPlaying, setIsPlaying, bpm, setBpm, audioMode, totalMeasures } = useDrumStore();

  // 使用音频引擎 hook（自动处理 gridData 变化）
  const { play, stop, loadingProgress } = useAudioEngine();

  const togglePlay = async () => {
    if (!isPlaying) {
      await play();
      setIsPlaying(true);
    } else {
      stop();
      setIsPlaying(false);
    }
  };

  const isLoading = loadingProgress < 1;

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
             <span className="font-medium">
               {audioMode === 'synth' ? 'Web Audio Synth' : 'Sample-Based Audio'}
             </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 bg-muted/40 px-8 py-3 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">

        {/* BPM Control */}
        <div className="flex items-center gap-4 w-52">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-10">BPM</span>
          <div className="flex flex-col flex-1 gap-2">
             <div className="flex items-baseline justify-center gap-2">
               <span className="text-2xl font-mono font-bold text-foreground tabular-nums tracking-tight">{bpm}</span>
               <span className="text-xs text-muted-foreground">BPM</span>
             </div>
             <Slider
                value={[bpm]}
                min={40}
                max={200}
                step={1}
                onValueChange={(vals) => setBpm(vals[0])}
                className="cursor-pointer"
             />
             <div className="text-[10px] text-muted-foreground text-center">
               {bpm} BPM = 每小节 {(60 / bpm * 4).toFixed(1)}秒
             </div>
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

        <div className="h-10 w-px bg-border" />

        {/* 加载进度指示器（仅在采样模式加载中显示） */}
        {audioMode === 'sample' && isLoading && (
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-primary" />
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${loadingProgress * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(loadingProgress * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 渲染器切换按钮、音频模式切换和小节数量显示 */}
      <div className="flex items-center gap-3">
        <AudioModeToggle />
        <div className="h-8 w-px bg-border" />
        <RendererToggle />
        <div className="h-8 w-px bg-border" />

        {/* 小节数量显示 */}
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
          <span className="text-xs text-muted-foreground">小节</span>
          <span className="text-sm font-medium tabular-nums">{totalMeasures}</span>
          <span className="text-xs text-muted-foreground">/ 10</span>
        </div>
      </div>
    </div>
  );
};
