import { create } from 'zustand';
import * as Tone from 'tone';

// 乐器定义
export type Instrument = 'kick' | 'snare' | 'hihat_closed' | 'hihat_open' | 'tom_high' | 'tom_floor';

export const INSTRUMENTS: Instrument[] = ['hihat_open', 'hihat_closed', 'tom_high', 'tom_floor', 'snare', 'kick'];

export const INSTRUMENT_NAMES: Record<Instrument, string> = {
  hihat_open: 'Open HH',
  hihat_closed: 'Closed HH',
  tom_high: 'High Tom',
  tom_floor: 'Floor Tom',
  snare: 'Snare',
  kick: 'Kick'
};

// 音符属性
export interface Note {
  active: boolean;
  velocity: number; // 0-127
  articulation: 'normal' | 'accent' | 'ghost';
}

// 核心状态
interface SequencerState {
  // 播放状态
  isPlaying: boolean;
  bpm: number;
  currentStep: number;
  
  // 网格数据
  gridData: Record<Instrument, Note[]>;
  
  // 配置
  stepsPerMeasure: number;
  totalMeasures: number;

  // Actions
  toggleNote: (inst: Instrument, step: number) => void;
  setBpm: (bpm: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentStep: (step: number) => void;
  clearGrid: () => void;
}

const DEFAULT_STEPS = 16;
const DEFAULT_MEASURES = 1;

const createEmptyGrid = (measures: number, stepsPerMeasure: number): Record<Instrument, Note[]> => {
  const totalSteps = measures * stepsPerMeasure;
  const grid: any = {};
  
  INSTRUMENTS.forEach(inst => {
    grid[inst] = Array(totalSteps).fill(null).map(() => ({
      active: false,
      velocity: 100,
      articulation: 'normal'
    }));
  });
  
  return grid;
};

export const useDrumStore = create<SequencerState>((set) => ({
  isPlaying: false,
  bpm: 120,
  currentStep: 0,
  stepsPerMeasure: DEFAULT_STEPS,
  totalMeasures: DEFAULT_MEASURES,
  gridData: createEmptyGrid(DEFAULT_MEASURES, DEFAULT_STEPS),

  toggleNote: (inst, step) => set((state) => {
    const newGrid = { ...state.gridData };
    const note = newGrid[inst][step];
    
    // Toggle logic: Inactive -> Normal -> Accent -> Ghost -> Inactive
    if (!note.active) {
      newGrid[inst][step] = { ...note, active: true, articulation: 'normal', velocity: 100 };
    } else if (note.articulation === 'normal') {
      newGrid[inst][step] = { ...note, articulation: 'accent', velocity: 127 };
    } else if (note.articulation === 'accent') {
      newGrid[inst][step] = { ...note, articulation: 'ghost', velocity: 60 };
    } else {
      newGrid[inst][step] = { ...note, active: false };
    }
    
    return { gridData: newGrid };
  }),

  setBpm: (bpm) => set({ bpm }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  clearGrid: () => set((state) => ({
    gridData: createEmptyGrid(state.totalMeasures, state.stepsPerMeasure)
  }))
}));
