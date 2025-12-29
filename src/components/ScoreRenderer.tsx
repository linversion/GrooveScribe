import { useEffect, useRef } from 'react';
import abcjs from 'abcjs';
import { useDrumStore } from '../store/useDrumStore';
import { generateAbc } from '../utils/abcGenerator';
import { Card } from '@/components/ui/card';

export const ScoreRenderer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { gridData, stepsPerMeasure, totalMeasures } = useDrumStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const abcString = generateAbc(gridData, stepsPerMeasure, totalMeasures);
    
    // 我们需要根据 dark mode 调整颜色
    // const isDark = document.documentElement.classList.contains('dark');
    // const color = isDark ? '#ffffff' : '#000000';

    abcjs.renderAbc(containerRef.current, abcString, {
      add_classes: true,
      responsive: "resize",
      scale: 1.1,
      staffwidth: 800,
      paddingtop: 10,
      paddingbottom: 10,
      paddingright: 20,
      paddingleft: 20,
    });
    
    // Hack to style SVG lines if needed, or rely on CSS
  }, [gridData, stepsPerMeasure, totalMeasures]);

  return (
    <Card className="w-full overflow-x-auto bg-card rounded-lg p-6 min-h-[160px] flex items-center justify-center shadow-sm">
      <div className="w-full flex justify-center">
         <div ref={containerRef} className="text-foreground min-w-[600px] [&_svg]:fill-current [&_path]:fill-current [&_text]:fill-current" />
      </div>
    </Card>
  );
};
