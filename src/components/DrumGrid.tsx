import { useDrumStore, INSTRUMENTS, INSTRUMENT_NAMES } from '../store/useDrumStore';
import { clsx } from 'clsx';

export const DrumGrid = () => {
  const { gridData, stepsPerMeasure, totalMeasures, currentStep, isPlaying, toggleNote } = useDrumStore();
  
  const totalSteps = stepsPerMeasure * totalMeasures;
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <div className="w-full overflow-x-auto select-none bg-cursor-sidebar p-6 rounded-xl border border-cursor-border">
      <div className="flex flex-col gap-1 min-w-max">
        {INSTRUMENTS.map((inst) => (
          <div key={inst} className="flex items-center gap-2">
            {/* Instrument Label */}
            <div className="w-24 text-xs font-medium text-gray-400 uppercase tracking-wider text-right pr-4">
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
                      "w-8 h-10 rounded-sm transition-all duration-75 relative",
                      "border border-opacity-10",
                      // Background logic
                      note.active ? "bg-cursor-accent border-cursor-accent" : (isDownbeat ? "bg-[#333] border-white" : "bg-[#252525] border-transparent"),
                      // Hover logic
                      "hover:opacity-80",
                      // Current step indicator
                      isCurrent && "ring-2 ring-white z-10"
                    )}
                  >
                    {/* Articulation Indicator */}
                    {note.active && (
                      <span className={clsx(
                        "absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white",
                        note.articulation === 'ghost' && "opacity-50",
                        note.articulation === 'accent' && "text-yellow-200 text-xs"
                      )}>
                        {note.articulation === 'accent' && '>'}
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
        <div className="flex items-center gap-2 mt-2">
          <div className="w-24"></div>
          <div className="flex gap-1">
            {steps.map((step) => (
              <div key={step} className="w-8 text-center text-[10px] text-gray-600">
                {(step % 4) + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
