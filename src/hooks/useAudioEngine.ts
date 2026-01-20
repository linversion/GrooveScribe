import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { useDrumStore, Instrument, INSTRUMENTS } from '../store/useDrumStore';
import { SynthStrategy } from '../strategies/SynthStrategy';
import { SamplerStrategy } from '../strategies/SamplerStrategy';
import { AudioEngineStrategy } from '../strategies/AudioEngineStrategy';

/**
 * 音频引擎 Hook
 * 支持合成器和采样器双模式，使用 Tone.Part 管理音序，支持 gridData 动态更新
 */
export const useAudioEngine = () => {
  const { gridData, bpm, isPlaying, setCurrentStep, stepsPerMeasure, totalMeasures, audioMode } = useDrumStore();

  // Refs for Tone.js objects
  const partRef = useRef<Tone.Part | null>(null);
  const strategyRef = useRef<AudioEngineStrategy | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);

  // 根据音频模式初始化策略
  useEffect(() => {
    const initStrategy = async () => {
      console.log(`[AudioEngine] Initializing ${audioMode} mode...`);

      // 清理旧策略
      if (strategyRef.current) {
        strategyRef.current.dispose();
        strategyRef.current = null;
      }

      // 根据模式创建策略
      const Strategy = audioMode === 'synth' ? SynthStrategy : SamplerStrategy;
      strategyRef.current = new Strategy();

      try {
        await strategyRef.current.initialize();
        console.log(`[AudioEngine] ${audioMode} mode initialized successfully`);
      } catch (error) {
        console.error(`[AudioEngine] Failed to initialize ${audioMode} mode:`, error);
      }
    };

    initStrategy();
  }, [audioMode]);

  // 同步 BPM
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  // 根据 gridData 生成 Tone.Part events
  const generateEvents = useCallback(() => {
    const totalSteps = stepsPerMeasure * totalMeasures;
    const events: Array<{ time: string, step: number, notes: Array<{ instrument: Instrument, velocity: number, articulation: 'normal' | 'accent' | 'ghost' }> }> = [];

    for (let step = 0; step < totalSteps; step++) {
      const notesAtStep: Array<{ instrument: Instrument, velocity: number, articulation: 'normal' | 'accent' | 'ghost' }> = [];

      INSTRUMENTS.forEach(inst => {
        if (gridData[inst][step].active) {
          notesAtStep.push({
            instrument: inst,
            velocity: gridData[inst][step].velocity,
            articulation: gridData[inst][step].articulation
          });
        }
      });

      // 即使没有音符也要添加事件，用于更新 UI
      events.push({
        time: `0:0:${step}`, // Tone.js 时间格式: Bar:Quarter:Sixteenth
        step,
        notes: notesAtStep
      });
    }

    return events;
  }, [gridData, stepsPerMeasure, totalMeasures]);

  // Debounced 更新 Tone.Part
  const updateSequence = useCallback(() => {
    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce: 等待 100ms 后更新
    updateTimeoutRef.current = setTimeout(() => {
      console.log('[AudioEngine] Updating Tone.Part with new gridData...');

      const events = generateEvents();

      // 如果 Part 已存在，先停止并释放
      if (partRef.current) {
        partRef.current.stop();
        partRef.current.dispose();
      }

      // 创建新的 Tone.Part
      const part = new Tone.Part((time, event) => {
        // 更新 UI 游标
        Tone.Draw.schedule(() => {
          setCurrentStep(event.step);
        }, time);

        // 播放当前步骤的所有音符（使用统一接口）
        event.notes.forEach(({ instrument, velocity, articulation }) => {
          strategyRef.current?.playInstrument(
            instrument,
            velocity,
            articulation,
            time
          );
        });
      }, events);

      // 设置循环
      part.loop = true;
      part.loopEnd = `${totalMeasures}m`; // 以小节为单位

      partRef.current = part;

      // 如果正在播放，立即启动新的 Part
      if (isPlaying) {
        part.start(0);
      }
    }, 100); // 100ms debounce
  }, [generateEvents, isPlaying, setCurrentStep, totalMeasures]);

  // 监听 gridData 变化
  useEffect(() => {
    updateSequence();

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [updateSequence]);

  // 清理 Part
  useEffect(() => {
    return () => {
      if (partRef.current) {
        partRef.current.stop();
        partRef.current.dispose();
        partRef.current = null;
      }
    };
  }, []);

  // 播放控制
  const play = useCallback(async () => {
    await Tone.start();

    // 调试：输出当前BPM和时间信息
    console.log(`[AudioEngine] BPM: ${Tone.Transport.bpm.value}`);
    console.log(`[AudioEngine] Time for 16 steps at 80 BPM:`, Tone.Time('0:0:15').toSeconds(), 'seconds');

    Tone.Transport.start();
    if (partRef.current) {
      partRef.current.start(0);
    }
  }, []);

  const stop = useCallback(() => {
    Tone.Transport.stop();
    if (partRef.current) {
      partRef.current.stop();
    }
    setCurrentStep(0);
  }, [setCurrentStep]);

  return {
    play,
    stop,
    isReady: strategyRef.current?.isReady() ?? false,
    loadingProgress: strategyRef.current?.getLoadingProgress() ?? 1
  };
};
