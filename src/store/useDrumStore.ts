import { create } from 'zustand';

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

  // 渲染器选择
  renderer: 'abcjs' | 'abc2svg';

  // Actions
  toggleNote: (inst: Instrument, step: number) => void;
  setBpm: (bpm: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentStep: (step: number) => void;
  clearGrid: () => void;
  setRenderer: (renderer: 'abcjs' | 'abc2svg') => void;
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

/**
 * 创建默认的 Rock 节奏（与原版 GrooveScribe URL 一致）
 * 原版 URL: ?TimeSig=4/4&Div=16&Tempo=80&Measures=1&H=|xxxxxxxxxxxxxxxx|&S=|--O-O-------O---|&K=|o-------o-------|
 *
 * 节奏解析（从0开始）：
 * - H (Hi-hat Closed): 全部16个位置 xxxxxxxxxxxxxxxx
 * - S (Snare): 位置 2, 4, 13 为 accent 重音 --O-O-------O---
 * - K (Kick): 位置 1, 9 o-------o-------
 */
const createDefaultRockGrid = (measures: number, stepsPerMeasure: number): Record<Instrument, Note[]> => {
  const grid = createEmptyGrid(measures, stepsPerMeasure);

  // Hi-hat Closed: 全部16个位置（从0开始：0-15）
  for (let i = 0; i < 16; i++) {
    grid.hihat_closed[i] = {
      active: true,
      velocity: 100,
      articulation: 'normal' as const
    };
  }

  // Snare: 位置 2, 4, 13 为 accent 重音（原版从1开始是 3, 5, 14）
  [2, 4, 13].forEach(step => {
    if (step < 16) {
      grid.snare[step] = {
        active: true,
        velocity: 127,
        articulation: 'accent' as const
      };
    }
  });

  // Kick: 位置 0, 9（原版从1开始是 1, 10）
  [0, 9].forEach(step => {
    if (step < 16) {
      grid.kick[step] = {
        active: true,
        velocity: 100,
        articulation: 'normal' as const
      };
    }
  });

  return grid;
};

export const useDrumStore = create<SequencerState>((set) => ({
  isPlaying: false,
  bpm: 80, // 与原版一致
  currentStep: 0,
  stepsPerMeasure: DEFAULT_STEPS,
  totalMeasures: DEFAULT_MEASURES,
  gridData: createDefaultRockGrid(DEFAULT_MEASURES, DEFAULT_STEPS), // 使用默认 Rock 节奏
  renderer: (localStorage.getItem('renderer') as 'abcjs' | 'abc2svg') || 'abcjs', // 从 localStorage 读取，默认 abcjs

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
  })),
  setRenderer: (renderer) => {
    localStorage.setItem('renderer', renderer);
    set({ renderer });
  }
}));
