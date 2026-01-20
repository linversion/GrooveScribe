import * as Tone from 'tone';
import { AudioEngineStrategy } from './AudioEngineStrategy';
import { Instrument } from '../store/useDrumStore';
import { getSampleUrl, getMidiNote } from '../utils/sampleMapping';

/**
 * 采样器音频引擎策略
 * 使用真实的鼓采样文件播放音频
 * 特点：真实音质、支持多种演奏法
 */
export class SamplerStrategy implements AudioEngineStrategy {
  private samplers: Map<Instrument, Tone.Sampler> = new Map();
  private loadedSamples = new Set<Instrument>();
  private loadingPromises = new Map<Instrument, Promise<void>>();
  private totalInstruments = 6; // 总共6种乐器

  async initialize(): Promise<void> {
    console.log('[SamplerStrategy] Loading samples...');

    // 按优先级分批加载采样
    const priority: Instrument[] = ['kick', 'snare', 'hihat_closed', 'hihat_open', 'tom_high', 'tom_floor'];

    for (const instrument of priority) {
      await this.loadInstrument(instrument);
    }

    console.log('[SamplerStrategy] All samples loaded');
  }

  /**
   * 加载单个乐器的采样
   * @param instrument - 乐器名称
   */
  private async loadInstrument(instrument: Instrument): Promise<void> {
    // 如果已加载，直接返回
    if (this.loadedSamples.has(instrument)) {
      return;
    }

    // 检查是否正在加载中
    let promise = this.loadingPromises.get(instrument);
    if (!promise) {
      promise = this._loadInstrument(instrument);
      this.loadingPromises.set(instrument, promise);
    }

    await promise;
  }

  /**
   * 实际加载采样的方法
   * @param instrument - 乐器名称
   */
  private async _loadInstrument(instrument: Instrument): Promise<void> {
    try {
      console.log(`[SamplerStrategy] Loading ${instrument} samples...`);

      // 为每个演奏法创建采样映射
      const urls: Record<string, string> = {};

      // Snare 有多个演奏法变体
      if (instrument === 'snare') {
        urls['C4'] = getSampleUrl(instrument, 'normal');
        urls['D4'] = getSampleUrl(instrument, 'accent');
        urls['E4'] = getSampleUrl(instrument, 'ghost');
      } else {
        // 其他乐器只有一个采样
        urls['C4'] = getSampleUrl(instrument, 'normal');
      }

      // 创建采样器
      const sampler = new Tone.Sampler({
        urls: urls,
        release: 1,
        curve: 'exponential'
      }).toDestination();

      // 等待采样加载完成
      await Tone.loaded();

      this.samplers.set(instrument, sampler);
      this.loadedSamples.add(instrument);

      console.log(`[SamplerStrategy] ${instrument} loaded successfully`);
    } catch (error) {
      console.error(`[SamplerStrategy] Failed to load ${instrument}:`, error);
      throw error;
    }
  }

  playInstrument(
    instrument: Instrument,
    noteVelocity: number,
    articulation: 'normal' | 'accent' | 'ghost',
    time: number
  ): void {
    const sampler = this.samplers.get(instrument);

    if (!sampler) {
      console.warn(`[SamplerStrategy] ${instrument} not loaded yet`);
      return;
    }

    // 获取 MIDI 音符
    const midiNote = this.getMidiNoteForArticulation(instrument, articulation);

    // 映射 velocity
    const normalizedVelocity = this.mapVelocity(noteVelocity, articulation);

    // 触发采样播放
    sampler.triggerAttack(midiNote, time, normalizedVelocity);
  }

  dispose(): void {
    console.log('[SamplerStrategy] Disposing samplers...');

    this.samplers.forEach((sampler) => {
      sampler.dispose();
    });

    this.samplers.clear();
    this.loadedSamples.clear();
    this.loadingPromises.clear();
  }

  isReady(): boolean {
    return this.loadedSamples.size === this.totalInstruments;
  }

  getLoadingProgress(): number {
    return this.loadedSamples.size / this.totalInstruments;
  }

  getName(): string {
    return 'Sample';
  }

  /**
   * 根据演奏法获取 MIDI 音符
   * @param instrument - 乐器名称
   * @param articulation - 演奏法
   * @returns MIDI 音符编号
   */
  private getMidiNoteForArticulation(instrument: Instrument, articulation: 'normal' | 'accent' | 'ghost'): string {
    // Snare 使用不同音高表示不同演奏法
    if (instrument === 'snare') {
      switch (articulation) {
        case 'normal':
          return 'C4';
        case 'accent':
          return 'D4';
        case 'ghost':
          return 'E4';
        default:
          return 'C4';
      }
    }

    // 其他乐器统一使用 C4
    return 'C4';
  }

  /**
   * 根据 articulation 映射 velocity
   * @param rawVelocity - 原始力度 (0-127)
   * @param articulation - 演奏法
   * @returns 归一化力度 (0-1)
   */
  private mapVelocity(rawVelocity: number, articulation: 'normal' | 'accent' | 'ghost'): number {
    let base = rawVelocity / 127;

    switch (articulation) {
      case 'accent':
        return Math.min(base * 1.3, 1.0); // 提升到 130%
      case 'ghost':
        return base * 0.6; // 降低到 60%
      default:
        return base;
    }
  }
}
