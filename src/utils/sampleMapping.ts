import { Instrument } from '../store/useDrumStore';

/**
 * 采样文件映射配置
 * 定义每个乐器和演奏法对应的采样文件名
 */
export const SAMPLE_FILES: Record<Instrument, Record<string, string>> = {
  kick: {
    normal: 'kick.mp3'
  },
  snare: {
    normal: 'snare-normal.mp3',
    accent: 'snare-accent.mp3',
    ghost: 'snare-ghost.mp3'
  },
  hihat_closed: {
    normal: 'hihat-closed.mp3'
  },
  hihat_open: {
    normal: 'hihat-open.mp3'
  },
  tom_high: {
    normal: 'tom-high.mp3'
  },
  tom_floor: {
    normal: 'tom-floor.mp3'
  }
};

/**
 * 采样文件的基础 URL
 */
export const BASE_URL = '/samples/';

/**
 * MIDI 音符映射
 * 将乐器和演奏法映射到 MIDI 音符编号
 */
export const NOTE_TO_MIDI: Record<Instrument, Record<string, number>> = {
  kick: {
    normal: 35
  },
  snare: {
    normal: 38,
    accent: 22,  // 重音使用不同音高
    ghost: 21
  },
  hihat_closed: {
    normal: 42
  },
  hihat_open: {
    normal: 46
  },
  tom_high: {
    normal: 48
  },
  tom_floor: {
    normal: 43
  }
};

/**
 * 获取乐器对应的采样文件 URL
 * @param instrument - 乐器名称
 * @param articulation - 演奏法
 * @returns 采样文件的完整 URL
 */
export function getSampleUrl(instrument: Instrument, articulation: 'normal' | 'accent' | 'ghost'): string {
  const fileName = SAMPLE_FILES[instrument][articulation] || SAMPLE_FILES[instrument].normal;
  return BASE_URL + fileName;
}

/**
 * 获取乐器对应的 MIDI 音符编号
 * @param instrument - 乐器名称
 * @param articulation - 演奏法
 * @returns MIDI 音符编号
 */
export function getMidiNote(instrument: Instrument, articulation: 'normal' | 'accent' | 'ghost'): number {
  return NOTE_TO_MIDI[instrument][articulation] || NOTE_TO_MIDI[instrument].normal;
}
