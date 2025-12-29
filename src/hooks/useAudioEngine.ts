import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { useDrumStore, Instrument, INSTRUMENTS } from '../store/useDrumStore';

/**
 * 音频引擎 Hook
 * 使用 Tone.Part 管理音序，支持 gridData 动态更新
 */
export const useAudioEngine = () => {
  const { gridData, bpm, isPlaying, setCurrentStep, stepsPerMeasure, totalMeasures } = useDrumStore();
  
  // Refs for Tone.js objects
  const partRef = useRef<Tone.Part | null>(null);
  const synthsRef = useRef<Record<string, any>>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化音色
  useEffect(() => {
    console.log('[AudioEngine] Initializing synths...');
    
    // Kick - 使用 MembraneSynth 模拟低频底鼓
    synthsRef.current.kick = new Tone.MembraneSynth({
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
    synthsRef.current.snare = snareNoise; // 主要用 noise
    synthsRef.current.snareTone = snareTone;

    // Hi-Hat - MetalSynth
    synthsRef.current.hihat_closed = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();

    synthsRef.current.hihat_open = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.3, release: 0.3 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();

    // Toms
    synthsRef.current.tom_floor = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.5, sustain: 0 }
    }).toDestination();

    synthsRef.current.tom_high = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0 }
    }).toDestination();

    return () => {
      console.log('[AudioEngine] Disposing synths...');
      Object.values(synthsRef.current).forEach(synth => synth.dispose());
      synthsRef.current = {};
    };
  }, []);

  // 同步 BPM
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  // 根据 gridData 生成 Tone.Part events
  const generateEvents = useCallback(() => {
    const totalSteps = stepsPerMeasure * totalMeasures;
    const events: Array<{ time: string, step: number, notes: Array<{ instrument: Instrument, velocity: number }> }> = [];

    for (let step = 0; step < totalSteps; step++) {
      const notesAtStep: Array<{ instrument: Instrument, velocity: number }> = [];

      INSTRUMENTS.forEach(inst => {
        if (gridData[inst][step].active) {
          notesAtStep.push({
            instrument: inst,
            velocity: gridData[inst][step].velocity
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

        // 播放当前步骤的所有音符
        event.notes.forEach(({ instrument, velocity }) => {
          const normalizedVelocity = velocity / 127;
          
          switch (instrument) {
            case 'kick':
              synthsRef.current.kick?.triggerAttackRelease('C1', '8n', time, normalizedVelocity);
              break;
            case 'snare':
              synthsRef.current.snare?.triggerAttackRelease('16n', time, normalizedVelocity);
              synthsRef.current.snareTone?.triggerAttackRelease('G2', '32n', time, normalizedVelocity * 0.3);
              break;
            case 'hihat_closed':
              synthsRef.current.hihat_closed?.triggerAttackRelease('32n', time, normalizedVelocity * 0.5);
              break;
            case 'hihat_open':
              synthsRef.current.hihat_open?.triggerAttackRelease('8n', time, normalizedVelocity * 0.6);
              break;
            case 'tom_floor':
              synthsRef.current.tom_floor?.triggerAttackRelease('G2', '8n', time, normalizedVelocity);
              break;
            case 'tom_high':
              synthsRef.current.tom_high?.triggerAttackRelease('C3', '8n', time, normalizedVelocity);
              break;
          }
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
    stop
  };
};
