import { useEffect, useRef } from 'react';
import abcjs from 'abcjs';
import { useDrumStore } from '../store/useDrumStore';
import { generateAbc } from '../utils/abcGenerator';

export const ScoreRenderer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { gridData, stepsPerMeasure, totalMeasures } = useDrumStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const abcString = generateAbc(gridData, stepsPerMeasure, totalMeasures);
    
    abcjs.renderAbc(containerRef.current, abcString, {
      add_classes: true,
      responsive: "resize",
      scale: 1.2,
      staffwidth: 800,
      paddingtop: 20,
      paddingbottom: 20,
      paddingright: 20,
      paddingleft: 20,
    });
    
  }, [gridData, stepsPerMeasure, totalMeasures]);

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg p-4 min-h-[160px] flex items-center justify-center">
      <div ref={containerRef} className="text-black w-full" />
    </div>
  );
};
