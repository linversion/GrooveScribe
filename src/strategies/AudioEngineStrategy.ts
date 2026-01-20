import { Instrument } from '../store/useDrumStore';

/**
 * 音频引擎策略接口
 * 定义了合成器和采样器必须实现的统一接口
 */
export interface AudioEngineStrategy {
  /**
   * 初始化音频引擎
   * 合成器模式：立即返回
   * 采样器模式：异步加载采样文件
   */
  initialize(): Promise<void>;

  /**
   * 播放指定乐器
   * @param instrument - 乐器名称
   * @param noteVelocity - 音符力度 (0-127)
   * @param articulation - 演奏法 (normal/accent/ghost)
   * @param time - Tone.js 时间对象
   */
  playInstrument(
    instrument: Instrument,
    noteVelocity: number,
    articulation: 'normal' | 'accent' | 'ghost',
    time: number
  ): void;

  /**
   * 释放所有音频资源
   */
  dispose(): void;

  /**
   * 检查引擎是否已就绪
   * 合成器：始终返回 true
   * 采样器：所有采样加载完成后返回 true
   */
  isReady(): boolean;

  /**
   * 获取加载进度 (0-1)
   * 合成器：返回 1.0 (无需加载)
   * 采样器：返回已加载采样的比例
   */
  getLoadingProgress(): number;

  /**
   * 获取策略名称
   */
  getName(): string;
}
