import { useDrumStore } from '../store/useDrumStore';
import { Button } from '@/components/ui/button';
import { Shuffle } from 'lucide-react';

/**
 * 渲染器切换按钮
 * 允许用户在 abcjs（现代）和 abc2svg（原版风格）之间切换
 */
export const RendererToggle = () => {
  const { renderer, setRenderer } = useDrumStore();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setRenderer(renderer === 'abcjs' ? 'abc2svg' : 'abcjs')}
      className="gap-2"
      title={`切换到 ${renderer === 'abcjs' ? 'abc2svg (原版风格)' : 'abcjs (现代化)'}`}
    >
      <Shuffle size={14} />
      <span className="text-xs">
        渲染器: <strong className="text-foreground">{renderer}</strong>
      </span>
      <span className="text-muted-foreground text-[10px]">
        ({renderer === 'abcjs' ? '现代' : '原版'})
      </span>
    </Button>
  );
};
