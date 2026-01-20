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

// 音频模式
export type AudioMode = 'synth' | 'sample';

// 小节数量限制
export const MIN_MEASURES = 1;
export const MAX_MEASURES = 10;
export const MEASURE_WARNING_THRESHOLD = 5;

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

  // 音频模式
  audioMode: AudioMode;

  // Actions
  toggleNote: (inst: Instrument, step: number) => void;
  setBpm: (bpm: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentStep: (step: number) => void;
  clearGrid: () => void;
  setRenderer: (renderer: 'abcjs' | 'abc2svg') => void;
  setAudioMode: (mode: AudioMode) => void;
  addMeasure: () => void;
  removeMeasure: (measureIndex: number) => void;
  setTotalMeasures: (count: number) => void;
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
  renderer: (localStorage.getItem('renderer') as 'abcjs' | 'abc2svg') || 'abc2svg', // 从 localStorage 读取，默认 abc2svg
  audioMode: (localStorage.getItem('audioMode') as AudioMode) || 'synth', // 从 localStorage 读取，默认 synth

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
  },
  setAudioMode: (mode) => {
    localStorage.setItem('audioMode', mode);
    set({ audioMode: mode });
  },

  addMeasure: () => set((state) => {
    // 限制最大小节数
    if (state.totalMeasures >= MAX_MEASURES) {
      console.warn('[useDrumStore] 已达到最大小节数量限制');
      return state;
    }

    const newTotalMeasures = state.totalMeasures + 1;
    const newTotalSteps = state.stepsPerMeasure * newTotalMeasures;
    const oldTotalSteps = state.stepsPerMeasure * state.totalMeasures;

    const newGrid = { ...state.gridData };

    // 为每个乐器扩展数组
    INSTRUMENTS.forEach(inst => {
      const oldNotes = state.gridData[inst];
      const newNotes = [...oldNotes];

      // 复制最后一小节的内容作为默认值
      const lastMeasureStart = oldTotalSteps - state.stepsPerMeasure;
      for (let i = 0; i < state.stepsPerMeasure; i++) {
        const sourceNote = oldNotes[lastMeasureStart + i];
        newNotes.push({
          active: sourceNote.active,
          velocity: sourceNote.velocity,
          articulation: sourceNote.articulation
        });
      }

      newGrid[inst] = newNotes;
    });

    console.log(`[useDrumStore] 添加小节: ${state.totalMeasures} -> ${newTotalMeasures}`);

    return {
      gridData: newGrid,
      totalMeasures: newTotalMeasures
    };
  }),

  removeMeasure: (measureIndex) => set((state) => {
    // 限制最小小节数
    if (state.totalMeasures <= MIN_MEASURES) {
      console.warn('[useDrumStore] 至少保留1小节');
      return state;
    }

    const newTotalMeasures = state.totalMeasures - 1;
    const deleteStart = measureIndex * state.stepsPerMeasure;
    const deleteEnd = deleteStart + state.stepsPerMeasure;

    const newGrid = { ...state.gridData };

    // 为每个乐器删除指定小节的数据
    INSTRUMENTS.forEach(inst => {
      const oldNotes = state.gridData[inst];
      const newNotes = [
        ...oldNotes.slice(0, deleteStart),  // 删除小节之前的数据
        ...oldNotes.slice(deleteEnd)         // 删除小节之后的数据
      ];
      newGrid[inst] = newNotes;
    });

    console.log(`[useDrumStore] 删除小节 ${measureIndex + 1}: ${state.totalMeasures} -> ${newTotalMeasures}`);

    return {
      gridData: newGrid,
      totalMeasures: newTotalMeasures,
      currentStep: 0 // 重置当前步骤
    };
  }),

  setTotalMeasures: (count) => set((state) => {
    const clampedCount = Math.max(MIN_MEASURES, Math.min(MAX_MEASURES, count));

    if (clampedCount === state.totalMeasures) {
      return state;
    }

    const newTotalSteps = state.stepsPerMeasure * clampedCount;
    const oldTotalSteps = state.stepsPerMeasure * state.totalMeasures;

    const newGrid = { ...state.gridData };

    INSTRUMENTS.forEach(inst => {
      const oldNotes = state.gridData[inst];

      if (clampedCount > state.totalMeasures) {
        // 增加小节：复制最后一小节
        const newNotes = [...oldNotes];
        const lastMeasureStart = oldTotalSteps - state.stepsPerMeasure;

        for (let i = oldTotalSteps; i < newTotalSteps; i++) {
          const sourceIndex = lastMeasureStart + ((i - oldTotalSteps) % state.stepsPerMeasure);
          const sourceNote = oldNotes[sourceIndex];
          newNotes.push({ ...sourceNote });
        }

        newGrid[inst] = newNotes;
      } else {
        // 减少小节：截断数组
        newGrid[inst] = oldNotes.slice(0, newTotalSteps);
      }
    });

    console.log(`[useDrumStore] 设置小节数: ${state.totalMeasures} -> ${clampedCount}`);

    return {
      gridData: newGrid,
      totalMeasures: clampedCount,
      currentStep: 0 // 重置当前步骤
    };
  })
}));
