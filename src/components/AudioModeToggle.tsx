import { Music, Guitar } from 'lucide-react';
import { useDrumStore } from '../store/useDrumStore';
import { Button } from '@/components/ui/button';

/**
 * 音频模式切换组件
 * 允许用户在合成器模式和采样模式之间切换
 */
export const AudioModeToggle = () => {
  const { audioMode, setAudioMode } = useDrumStore();

  return (
    <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
      <Button
        variant={audioMode === 'synth' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setAudioMode('synth')}
        className="gap-2"
        title="快速启动，程序化音色"
      >
        <Music size={16} />
        <span>合成器</span>
      </Button>

      <Button
        variant={audioMode === 'sample' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setAudioMode('sample')}
        className="gap-2"
        title="真实鼓音色，需要加载采样"
      >
        <Guitar size={16} />
        <span>采样</span>
      </Button>
    </div>
  );
};
