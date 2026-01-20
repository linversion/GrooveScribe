import * as Tone from 'tone';
import { AudioEngineStrategy } from './AudioEngineStrategy';
import { Instrument } from '../store/useDrumStore';

/**
 * 合成器音频引擎策略
 * 使用 Tone.js 的合成器实时生成音频，无需加载采样文件
 * 特点：启动快、体积小、性能好
 */
export class SynthStrategy implements AudioEngineStrategy {
  private synths: Record<string, any> = {};

  async initialize(): Promise<void> {
    console.log('[SynthStrategy] Initializing synths...');

    // Kick - 使用 MembraneSynth 模拟低频底鼓
    this.synths.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).toDestination();

    // Snare - 使用 NoiseSynth + MembraneSynth 混合
    const snareNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).toDestination();

    const snareTone = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.1, sustain: 0 }
    }).toDestination();

    this.synths.snare = snareNoise; // 主要用 noise
    this.synths.snareTone = snareTone;

    // Hi-Hat - MetalSynth
    this.synths.hihat_closed = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();

    this.synths.hihat_open = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.3, release: 0.3 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();

    // Toms
    this.synths.tom_floor = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.5, sustain: 0 }
    }).toDestination();

    this.synths.tom_high = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0 }
    }).toDestination();

    console.log('[SynthStrategy] All synths initialized');
    // 合成器无需异步加载，直接返回
    return Promise.resolve();
  }

  playInstrument(
    instrument: Instrument,
    noteVelocity: number,
    articulation: 'normal' | 'accent' | 'ghost',
    time: number
  ): void {
    const normalizedVelocity = this.mapVelocity(noteVelocity, articulation);

    switch (instrument) {
      case 'kick':
        this.synths.kick?.triggerAttackRelease('C1', '8n', time, normalizedVelocity);
        break;
      case 'snare':
        this.synths.snare?.triggerAttackRelease('16n', time, normalizedVelocity);
        this.synths.snareTone?.triggerAttackRelease('G2', '32n', time, normalizedVelocity * 0.3);
        break;
      case 'hihat_closed':
        this.synths.hihat_closed?.triggerAttackRelease('C5', '32n', time, normalizedVelocity * 0.5);
        break;
      case 'hihat_open':
        this.synths.hihat_open?.triggerAttackRelease('A5', '8n', time, normalizedVelocity * 0.6);
        break;
      case 'tom_floor':
        this.synths.tom_floor?.triggerAttackRelease('G2', '8n', time, normalizedVelocity);
        break;
      case 'tom_high':
        this.synths.tom_high?.triggerAttackRelease('C3', '8n', time, normalizedVelocity);
        break;
    }
  }

  dispose(): void {
    console.log('[SynthStrategy] Disposing synths...');
    Object.values(this.synths).forEach(synth => {
      if (synth && typeof synth.dispose === 'function') {
        synth.dispose();
      }
    });
    this.synths = {};
  }

  isReady(): boolean {
    // 合成器立即可用
    return true;
  }

  getLoadingProgress(): number {
    // 合成器无需加载
    return 1.0;
  }

  getName(): string {
    return 'Synth';
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
