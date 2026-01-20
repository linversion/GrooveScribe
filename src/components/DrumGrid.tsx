import { useDrumStore, INSTRUMENTS, INSTRUMENT_NAMES } from '../store/useDrumStore';
import { clsx } from 'clsx';
import { Card } from '@/components/ui/card';
import { MeasureControls } from './MeasureControls';

/**
 * 单个小节的网格组件
 */
interface MeasureGridProps {
  measureIndex: number;
  gridData: Record<string, any>;
  stepsPerMeasure: number;
  currentStep: number;
  isPlaying: boolean;
  onToggleNote: (inst: string, step: number) => void;
}

const MeasureGrid = ({ measureIndex, gridData, stepsPerMeasure, currentStep, isPlaying, onToggleNote }: MeasureGridProps) => {
  const startStep = measureIndex * stepsPerMeasure;
  const endStep = startStep + stepsPerMeasure;

  return (
    <div className="flex flex-col gap-3">
      {INSTRUMENTS.map((inst) => (
        <div key={inst} className="flex items-center gap-3 group">
          {/* Instrument Label - 只在第一小节显示 */}
          {measureIndex === 0 && (
            <div className="w-28 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right pr-3 group-hover:text-foreground transition-colors duration-200">
              {INSTRUMENT_NAMES[inst]}
            </div>
          )}

          {/* Steps */}
          <div className={clsx("flex gap-1.5", measureIndex > 0 && "ml-[136px]")}>
            {Array.from({ length: stepsPerMeasure }).map((_, offset) => {
              const step = startStep + offset;
              const note = gridData[inst][step];
              const isCurrent = isPlaying && currentStep === step;
              const isDownbeat = step % 4 === 0;

              return (
                <button
                  key={`${inst}-${step}`}
                  onClick={() => onToggleNote(inst, step)}
                  className={clsx(
                    "w-9 h-14 rounded-md transition-all duration-200 relative focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    // Background logic
                    note.active
                      ? "bg-primary border-2 border-primary shadow-md scale-[0.95]"
                      : (isDownbeat
                          ? "bg-muted/70 hover:bg-muted-foreground/30"
                          : "bg-muted/20 hover:bg-muted-foreground/20"),
                    // Hover logic
                    !note.active && "hover:scale-105",
                    // Current step indicator
                    isCurrent && "ring-2 ring-ring ring-offset-2 z-10 brightness-110 scale-105 shadow-lg"
                  )}
                  aria-label={`${INSTRUMENT_NAMES[inst]} step ${step + 1}`}
                >
                  {/* Articulation Indicator */}
                  {note.active && (
                    <span className={clsx(
                      "absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground",
                      note.articulation === 'ghost' && "opacity-50",
                      note.articulation === 'accent' && "text-accent-foreground scale-125"
                    )}>
                      {note.articulation === 'accent' && '›'}
                      {note.articulation === 'ghost' && '()'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Step Numbers */}
      <div className={clsx("flex items-center gap-3 mt-3 pt-2 border-t border-border/50", measureIndex > 0 && "ml-[136px]")}>
        {measureIndex === 0 && <div className="w-28"></div>}
        <div className="flex gap-1.5">
          {Array.from({ length: stepsPerMeasure }).map((_, offset) => {
            const step = startStep + offset;
            return (
              <div key={step} className={clsx(
                "w-9 text-center text-[10px] font-mono transition-colors duration-200",
                isPlaying && currentStep === step
                  ? "text-primary font-bold scale-110"
                  : "text-muted-foreground"
              )}>
                {(step % 4) + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const DrumGrid = () => {
  const { gridData, stepsPerMeasure, totalMeasures, currentStep, isPlaying, toggleNote } = useDrumStore();

  // 计算小节数组
  const measureIndices = Array.from({ length: totalMeasures }, (_, i) => i);

  return (
    <Card className="w-full overflow-x-auto select-none bg-card p-8 rounded-xl border-border shadow-md">
      <div className="flex flex-col gap-6">
        {measureIndices.map((measureIndex) => (
          <div key={measureIndex} className="relative">
            {/* 小节标题和控制 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-foreground">小节 {measureIndex + 1}</h3>
                {measureIndex === totalMeasures - 1 && totalMeasures >= 5 && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-500">（小节较多，可能影响性能）</span>
                )}
              </div>
              <MeasureControls measureIndex={measureIndex} isLast={measureIndex === totalMeasures - 1} />
            </div>

            {/* 小节网格 */}
            <MeasureGrid
              measureIndex={measureIndex}
              gridData={gridData}
              stepsPerMeasure={stepsPerMeasure}
              currentStep={currentStep}
              isPlaying={isPlaying}
              onToggleNote={toggleNote}
            />

            {/* 小节分隔线（非最后一个小节） */}
            {measureIndex < totalMeasures - 1 && (
              <div className="w-full h-px bg-border my-6"></div>
            )}
          </div>
        ))}
      </div>
    </Card>
 );
};
