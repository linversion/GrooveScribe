import { useDrumStore, INSTRUMENTS, INSTRUMENT_NAMES } from '../store/useDrumStore';
import { clsx } from 'clsx';
import { Card } from '@/components/ui/card';

export const DrumGrid = () => {
  const { gridData, stepsPerMeasure, totalMeasures, currentStep, isPlaying, toggleNote } = useDrumStore();
  
  const totalSteps = stepsPerMeasure * totalMeasures;
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <Card className="w-full overflow-x-auto select-none bg-card p-6 rounded-xl border-border shadow-sm">
      <div className="flex flex-col gap-2 min-w-max">
        {INSTRUMENTS.map((inst) => (
          <div key={inst} className="flex items-center gap-3 group">
            {/* Instrument Label */}
            <div className="w-24 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right pr-2 group-hover:text-foreground transition-colors">
              {INSTRUMENT_NAMES[inst]}
            </div>
            
            {/* Steps */}
            <div className="flex gap-1">
              {steps.map((step) => {
                const note = gridData[inst][step];
                const isCurrent = isPlaying && currentStep === step;
                const isDownbeat = step % 4 === 0;
                
                return (
                  <button
                    key={`${inst}-${step}`}
                    onClick={() => toggleNote(inst, step)}
                    className={clsx(
                      "w-8 h-12 rounded-[4px] transition-all duration-100 relative",
                      // Background logic
                      note.active 
                        ? "bg-primary border-primary shadow-sm scale-[0.95]" 
                        : (isDownbeat 
                            ? "bg-muted/80 hover:bg-muted-foreground/30" 
                            : "bg-muted/30 hover:bg-muted-foreground/20"),
                      // Hover logic
                      !note.active && "hover:scale-110",
                      // Current step indicator
                      isCurrent && "ring-2 ring-ring z-10 brightness-110 scale-105"
                    )}
                  >
                    {/* Articulation Indicator */}
                    {note.active && (
                      <span className={clsx(
                        "absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground",
                        note.articulation === 'ghost' && "opacity-60",
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
        
        {/* Step Numbers (Optional Helper) */}
        <div className="flex items-center gap-3 mt-2">
          <div className="w-24"></div>
          <div className="flex gap-1">
            {steps.map((step) => (
              <div key={step} className={clsx(
                "w-8 text-center text-[9px] text-muted-foreground",
                isPlaying && currentStep === step && "text-primary font-bold"
              )}>
                {(step % 4) + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
