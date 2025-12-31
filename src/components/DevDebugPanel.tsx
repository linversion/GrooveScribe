import { useState, useRef, useEffect } from 'react';
import { useDrumStore, INSTRUMENT_NAMES } from '../store/useDrumStore';
import { X, ChevronDown, ChevronUp, Copy, Check, GripHorizontal } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * 开发环境调试面板
 * 只在开发模式下显示，用于实时查看鼓机序列数据
 * 支持拖动定位和折叠
 */
export const DevDebugPanel = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 }); // 初始位置（右下角）
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const panelRef = useRef<HTMLDivElement>(null);

  const { isPlaying, bpm, currentStep, gridData, stepsPerMeasure, totalMeasures } = useDrumStore();

  // 拖动处理
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只在头部区域允许拖动
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // 限制在视口内
        const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 384);
        const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 100);

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // 复制 JSON 数据到剪贴板
  const handleCopy = () => {
    const data = {
      isPlaying,
      bpm,
      currentStep,
      stepsPerMeasure,
      totalMeasures,
      gridData: Object.fromEntries(
        Object.entries(gridData).map(([inst, notes]) => [
          INSTRUMENT_NAMES[inst as keyof typeof INSTRUMENT_NAMES],
          notes.map((note, idx) => note.active ? `${idx}:${note.articulation}` : null).filter(Boolean)
        ])
      )
    };

    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 计算激活的音符总数
  const activeNotesCount = Object.values(gridData).reduce(
    (count, notes) => count + notes.filter((n) => n.active).length,
    0
  );

  return (
    <div
      ref={panelRef}
      className="fixed z-50 font-mono text-xs"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: 'auto',
        bottom: 'auto',
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
    >
      {/* 调试面板卡片 */}
      <div
        className={clsx(
          "bg-background/95 backdrop-blur border border-border rounded-lg shadow-2xl max-w-md w-96 transition-shadow",
          isDragging && "shadow-3xl scale-[1.02]"
        )}
        onMouseDown={handleMouseDown}
      >
        {/* 头部 - 可拖动区域 */}
        <div className="drag-handle flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 cursor-grab hover:bg-muted/40 transition-colors select-none">
          <div className="flex items-center gap-2">
            <GripHorizontal size={14} className="text-muted-foreground" />
            <div className={clsx(
              "w-2 h-2 rounded-full",
              isPlaying ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
            )} />
            <span className="font-bold text-foreground">Dev Debug Panel</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="复制 JSON"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-muted rounded transition-colors"
              title={isMinimized ? "展开" : "最小化"}
            >
              {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        {!isMinimized && (
          <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
            {/* 状态概览 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/30 p-2 rounded">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider">播放状态</div>
                <div className={clsx(
                  "font-bold text-sm",
                  isPlaying ? "text-green-500" : "text-muted-foreground"
                )}>
                  {isPlaying ? "播放中 ▶" : "已暂停 ⏸"}
                </div>
              </div>
              <div className="bg-muted/30 p-2 rounded">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider">当前步数</div>
                <div className="font-bold text-sm text-foreground">
                  {currentStep} / {stepsPerMeasure * totalMeasures - 1}
                </div>
              </div>
              <div className="bg-muted/30 p-2 rounded">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider">速度 BPM</div>
                <div className="font-bold text-sm text-primary">{bpm}</div>
              </div>
              <div className="bg-muted/30 p-2 rounded">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider">激活音符</div>
                <div className="font-bold text-sm text-foreground">{activeNotesCount}</div>
              </div>
            </div>

            {/* 配置信息 */}
            <div className="bg-muted/20 p-2 rounded">
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">配置</div>
              <div className="text-foreground space-y-0.5">
                <div>每小节步数: <span className="text-primary font-bold">{stepsPerMeasure}</span></div>
                <div>总小节数: <span className="text-primary font-bold">{totalMeasures}</span></div>
                <div>总步数: <span className="text-primary font-bold">{stepsPerMeasure * totalMeasures}</span></div>
              </div>
            </div>

            {/* 乐器序列详情 */}
            <div className="space-y-2">
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
                乐器序列 ({Object.keys(gridData).length})
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {Object.entries(gridData).map(([inst, notes]) => {
                  const activeNotes = notes.filter((n) => n.active);
                  const activeIndices = notes
                    .map((note, idx) => note.active ? idx : -1)
                    .filter((idx) => idx !== -1);

                  return (
                    <div key={inst} className="bg-muted/20 p-2 rounded hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">
                          {INSTRUMENT_NAMES[inst as keyof typeof INSTRUMENT_NAMES]}
                        </span>
                        <span className={clsx(
                          "text-[10px] px-1.5 py-0.5 rounded",
                          activeNotes.length > 0 ? "bg-primary/20 text-primary" : "bg-muted-foreground/20 text-muted-foreground"
                        )}>
                          {activeNotes.length} notes
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {activeIndices.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {activeIndices.map((idx) => {
                              const note = notes[idx];
                              const articulationColor = {
                                normal: "text-blue-400",
                                accent: "text-green-400",
                                ghost: "text-yellow-400"
                              }[note.articulation];

                              return (
                                <span
                                  key={idx}
                                  className={clsx(
                                    "px-1 py-0.5 bg-background rounded border border-border/50",
                                    articulationColor
                                  )}
                                >
                                  {idx}
                                  {note.articulation !== 'normal' && (
                                    <span className="ml-0.5 opacity-70">
                                      {note.articulation === 'accent' ? '›' : '°'}
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="italic">无激活音符</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 当前步数的音符 */}
            {isPlaying && (
              <div className="bg-primary/10 border border-primary/30 p-2 rounded">
                <div className="text-primary text-[10px] uppercase tracking-wider mb-1">
                  当前步数 #{currentStep} 激活的乐器
                </div>
                <div className="text-foreground text-xs">
                  {Object.entries(gridData)
                    .filter(([_, notes]) => notes[currentStep]?.active)
                    .map(([inst]) => INSTRUMENT_NAMES[inst as keyof typeof INSTRUMENT_NAMES])
                    .join(", ") || "无"}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
