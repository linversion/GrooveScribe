import { useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import { useDrumStore } from '../store/useDrumStore';
import { generateAbc } from '../utils/abcGenerator';
import { generateAbcOriginal } from '../utils/abcGeneratorOriginal';
import { renderAbc } from '../utils/abc2svg';
import { Card } from '@/components/ui/card';

export const ScoreRenderer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { gridData, stepsPerMeasure, totalMeasures, renderer, bpm } = useDrumStore();

  // 更新 abc2svg SVG 颜色的函数
  const updateAbc2svgColor = useCallback(() => {
    if (!containerRef.current || renderer !== 'abc2svg') return;

    const container = containerRef.current;
    const svgElement = container.querySelector('svg');

    if (svgElement) {
      const isDark = document.documentElement.classList.contains('dark');
      const color = isDark ? 'white' : 'black';
      svgElement.setAttribute('color', color);
      (svgElement as HTMLElement).style.color = color;
    }
  }, [renderer]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // 根据渲染器选择生成对应的 ABC
    const abcString = renderer === 'abc2svg'
      ? generateAbcOriginal(gridData, stepsPerMeasure, totalMeasures, bpm)
      : generateAbc(gridData, stepsPerMeasure, totalMeasures);

    // 使用对应的渲染器
    if (renderer === 'abc2svg') {
      // 使用 abc2svg 渲染（原版风格）
      try {
        renderAbc(container, abcString);

        // 设置初始颜色
        updateAbc2svgColor();
      } catch (error) {
        console.error('abc2svg rendering error:', error);
        // 如果 abc2svg 失败，显示错误信息
        container.innerHTML = `<div class="text-destructive p-4">渲染器错误: ${error instanceof Error ? error.message : '未知错误'}</div>`;
      }
    } else {
      // 使用 abcjs 渲染（现代化）
      container.innerHTML = ''; // 清空
      abcjs.renderAbc(container, abcString, {
        add_classes: true,
        responsive: "resize",
        scale: 1.2,
        staffwidth: 900,
        paddingtop: 15,
        paddingbottom: 15,
        paddingright: 30,
        paddingleft: 30,
      });
    }
  }, [gridData, stepsPerMeasure, totalMeasures, renderer, bpm, updateAbc2svgColor]);

  // 监听主题切换
  useEffect(() => {
    if (renderer !== 'abc2svg') return;

    // 监听 classList 变化（主题切换）
    const observer = new MutationObserver(() => {
      updateAbc2svgColor();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
    };
  }, [renderer, updateAbc2svgColor]);

  return (
    <Card className="w-full overflow-x-auto bg-card rounded-xl p-8 min-h-[180px] flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="w-full flex justify-center">
         <div
           ref={containerRef}
           className="text-foreground min-w-[700px] [&_svg]:fill-current [&_path]:fill-current [&_text]:fill-current [&_*]:transition-all [&_*]:duration-200"
         />
      </div>
    </Card>
  );
};
