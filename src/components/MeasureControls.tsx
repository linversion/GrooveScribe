import { Plus, X, AlertTriangle } from 'lucide-react';
import { useDrumStore, MEASURE_WARNING_THRESHOLD } from '../store/useDrumStore';
import { Button } from '@/components/ui/button';

interface MeasureControlsProps {
  measureIndex: number;
  isLast: boolean;
}

/**
 * 小节控制组件
 * 提供添加/删除小节的按钮和性能警告图标
 */
export const MeasureControls = ({ measureIndex, isLast }: MeasureControlsProps) => {
  const { totalMeasures, addMeasure, removeMeasure } = useDrumStore();
  const measureNumber = measureIndex + 1;

  const handleRemove = () => {
    if (totalMeasures > 1 && confirm(`确定要删除小节 ${measureNumber} 吗？`)) {
      removeMeasure(measureIndex);
    }
  };

  const handleAdd = () => {
    if (totalMeasures < 10) {
      addMeasure();

      // 达到5小节时显示警告
      if (totalMeasures + 1 >= MEASURE_WARNING_THRESHOLD) {
        setTimeout(() => {
          alert('注意：小节数量较多可能会影响性能。建议保持4小节以获得最佳体验。');
        }, 100);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 删除按钮（仅在非单小节时显示） */}
      {totalMeasures > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive transition-colors"
          title={`删除小节 ${measureNumber}`}
        >
          <X size={14} />
        </Button>
      )}

      {/* 添加按钮（仅在最后一个小节且未达到上限时显示） */}
      {isLast && totalMeasures < 10 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary transition-colors"
          title="添加小节"
        >
          <Plus size={14} />
        </Button>
      )}

      {/* 性能警告图标 */}
      {isLast && totalMeasures >= 5 && (
        <div
          className="flex items-center justify-center h-6 w-6"
          title="小节数量较多，可能影响性能"
        >
          <AlertTriangle size={14} className="text-yellow-500 dark:text-yellow-500" />
        </div>
      )}
    </div>
  );
};
