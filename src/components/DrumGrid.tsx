import { useDrumStore, INSTRUMENTS, INSTRUMENT_NAMES } from '../store/useDrumStore';
import { clsx } from 'clsx';
import { Card } from '@/components/ui/card';

export const DrumGrid = () => {
  const { gridData, stepsPerMeasure, totalMeasures, currentStep, isPlaying, toggleNote } = useDrumStore();

  const totalSteps = stepsPerMeasure * totalMeasures;
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <Card className="w-full overflow-x-auto select-none bg-card p-8 rounded-xl border-border shadow-md">
      <div className="flex flex-col gap-3 min-w-max">
        {INSTRUMENTS.map((inst) => (
          <div key={inst} className="flex items-center gap-3 group">
            {/* Instrument Label */}
            <div className="w-28 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right pr-3 group-hover:text-foreground transition-colors duration-200">
              {INSTRUMENT_NAMES[inst]}
            </div>

            {/* Steps */}
            <div className="flex gap-1.5">
              {steps.map((step) => {
                const note = gridData[inst][step];
                const isCurrent = isPlaying && currentStep === step;
                const isDownbeat = step % 4 === 0;

                return (
                  <button
                    key={`${inst}-${step}`}
                    onClick={() => toggleNote(inst, step)}
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

        {/* Step Numbers (Optional Helper) */}
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/50">
          <div className="w-28"></div>
          <div className="flex gap-1.5">
            {steps.map((step) => (
              <div key={step} className={clsx(
                "w-9 text-center text-[10px] font-mono transition-colors duration-200",
                isPlaying && currentStep === step
                  ? "text-primary font-bold scale-110"
                  : "text-muted-foreground"
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
