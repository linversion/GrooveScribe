import { describe, it, expect } from 'vitest';
import { generateAbc } from './abcGenerator';
import { generateAbcOriginal } from './abcGeneratorOriginal';
import { Instrument, Note } from '../store/useDrumStore';

/**
 * ABC 生成器单元测试
 * 对比 abcjs 和 abc2svg 两个版本的生成器
 */

// 辅助函数：创建测试用的鼓序列数据
const createTestGrid = (
  kick: Note[],
  snare: Note[],
  hihat_closed: Note[],
  hihat_open: Note[] = [],
  tom_high: Note[] = [],
  tom_floor: Note[] = []
): Record<Instrument, Note[]> => {
  const totalSteps = kick.length;
  return {
    kick,
    snare,
    hihat_closed,
    hihat_open: hihat_open.length > 0 ? hihat_open : Array(totalSteps).fill(null).map(() => ({ active: false, velocity: 100, articulation: 'normal' as const })),
    tom_high: tom_high.length > 0 ? tom_high : Array(totalSteps).fill(null).map(() => ({ active: false, velocity: 100, articulation: 'normal' as const })),
    tom_floor: tom_floor.length > 0 ? tom_floor : Array(totalSteps).fill(null).map(() => ({ active: false, velocity: 100, articulation: 'normal' as const })),
  };
};

// 辅助函数：创建音符
const createNote = (active: boolean = false, articulation: 'normal' | 'accent' | 'ghost' = 'normal', velocity: number = 100): Note => ({
  active,
  velocity,
  articulation
});

describe('ABC 生成器测试', () => {
  describe('abcGenerator (abcjs 版本)', () => {
    it('应该生成基本的 ABC 头部信息', () => {
      const emptyGrid = createTestGrid(
        Array(16).fill(null).map(() => createNote(false)),
        Array(16).fill(null).map(() => createNote(false)),
        Array(16).fill(null).map(() => createNote(false))
      );

      const result = generateAbc(emptyGrid, 16, 1);

      expect(result).toContain('X:1');
      expect(result).toContain('T:Generated Groove');
      expect(result).toContain('M:4/4');
      expect(result).toContain('L:1/16');
      expect(result).toContain('K:C perc');
    });

    it('应该正确生成 Rock 节奏（默认节奏）', () => {
      // Rock 节奏：
      // Hi-hat: 全部 16 个位置
      // Snare: 位置 2, 4, 13 为 accent
      // Kick: 位置 0, 9

      const hihatClosed = Array(16).fill(null).map((_, i) => createNote(true, 'normal'));
      const snare = Array(16).fill(null).map((_, i) =>
        [2, 4, 13].includes(i) ? createNote(true, 'accent', 127) : createNote(false)
      );
      const kick = Array(16).fill(null).map((_, i) =>
        [0, 9].includes(i) ? createNote(true, 'normal') : createNote(false)
      );

      const grid = createTestGrid(kick, snare, hihatClosed);
      const result = generateAbc(grid, 16, 1);

      // 验证包含底鼓音符
      expect(result).toContain('F');
      // 验证包含军鼓音符
      expect(result).toContain('c');
      // 验证包含 hi-hat 音符
      expect(result).toContain('^g');
      // 验证重音标记
      expect(result).toContain('!>!');
    });

    it('应该正确生成和弦（多个乐器同时发声）', () => {
      const grid = createTestGrid(
        // Kick: 位置 0
        Array(4).fill(null).map((_, i) => i === 0 ? createNote(true, 'normal') : createNote(false)),
        // Snare: 位置 0
        Array(4).fill(null).map((_, i) => i === 0 ? createNote(true, 'accent') : createNote(false)),
        // Hi-hat: 位置 0
        Array(4).fill(null).map((_, i) => i === 0 ? createNote(true, 'normal') : createNote(false))
      );

      const result = generateAbc(grid, 4, 1);

      // 应该包含和弦（方括号包围多个音符）
      expect(result).toContain('[');
      expect(result).toContain(']');
    });

    it('应该正确生成休止符', () => {
      const emptyGrid = createTestGrid(
        Array(4).fill(null).map(() => createNote(false)),
        Array(4).fill(null).map(() => createNote(false)),
        Array(4).fill(null).map(() => createNote(false))
      );

      const result = generateAbc(emptyGrid, 4, 1);

      // 应该包含休止符
      expect(result).toContain('z');
    });

    it('应该正确处理 ghost note', () => {
      const grid = createTestGrid(
        Array(4).fill(null).map(() => createNote(false)),
        // Snare: 位置 0 为 ghost note
        Array(4).fill(null).map((_, i) => i === 0 ? createNote(true, 'ghost', 60) : createNote(false)),
        Array(4).fill(null).map(() => createNote(false))
      );

      const result = generateAbc(grid, 4, 1);

      // 应该包含 ghost note 标记
      expect(result).toContain('!(.!!)!c');
    });

    it('应该正确生成多小节', () => {
      const grid = createTestGrid(
        // Kick: 每小节第一拍
        Array(32).fill(null).map((_, i) => i % 16 === 0 ? createNote(true, 'normal') : createNote(false)),
        Array(32).fill(null).map(() => createNote(false)),
        Array(32).fill(null).map(() => createNote(false))
      );

      const result = generateAbc(grid, 16, 2);

      // 应该有两个小节线
      const measureLines = result.match(/\|/g);
      expect(measureLines).toHaveLength(2);
    });
  });

  describe('abcGeneratorOriginal (abc2svg 版本)', () => {
    it('应该生成原版风格的 ABC 头部信息', () => {
      const emptyGrid = createTestGrid(
        Array(16).fill(null).map(() => createNote(false)),
        Array(16).fill(null).map(() => createNote(false)),
        Array(16).fill(null).map(() => createNote(false))
      );

      const result = generateAbcOriginal(emptyGrid, 16, 1, 80);

      expect(result).toContain('%abc');
      expect(result).toContain('%%fullsvg _1');
      expect(result).toContain('X:6');
      expect(result).toContain('M:4/4');
      expect(result).toContain('Q:1/4=80');
      expect(result).toContain('L:1/16');
      expect(result).toContain('%%scale 1.4');
      expect(result).toContain('%%flatbeams 1');
      expect(result).toContain('%%ornament up');
    });

    it('应该包含鼓谱符号映射', () => {
      const emptyGrid = createTestGrid(
        Array(16).fill(null).map(() => createNote(false)),
        Array(16).fill(null).map(() => createNote(false)),
        Array(16).fill(null).map(() => createNote(false))
      );

      const result = generateAbcOriginal(emptyGrid, 16, 1);

      expect(result).toContain('%%map drum');
      expect(result).toContain('heads=Xhead');
      expect(result).toContain('%%staves (Stickings Hands Feet)');
    });

    it('应该生成三个声部', () => {
      const emptyGrid = createTestGrid(
        Array(16).fill(null).map(() => createNote(false)),
        Array(16).fill(null).map(() => createNote(false)),
        Array(16).fill(null).map(() => createNote(false))
      );

      const result = generateAbcOriginal(emptyGrid, 16, 1);

      expect(result).toContain('[V:Stickings]');
      expect(result).toContain('[V:Hands]');
      expect(result).toContain('[V:Feet]');
    });

    it('应该正确生成 Rock 节奏（默认节奏）', () => {
      const hihatClosed = Array(16).fill(null).map((_, i) => createNote(true, 'normal'));
      const snare = Array(16).fill(null).map((_, i) =>
        [2, 4, 13].includes(i) ? createNote(true, 'accent', 127) : createNote(false)
      );
      const kick = Array(16).fill(null).map((_, i) =>
        [0, 9].includes(i) ? createNote(true, 'normal') : createNote(false)
      );

      const grid = createTestGrid(kick, snare, hihatClosed);
      const result = generateAbcOriginal(grid, 16, 1, 80);

      // 验证脚声部包含底鼓
      const feetSection = result.split('[V:Feet]')[1].split('[V:Hands]')[0];
      expect(feetSection).toContain('F');

      // 验证手声部包含军鼓和 hi-hat
      const handsSection = result.split('[V:Hands]')[1];
      expect(handsSection).toContain('c'); // Snare
      expect(handsSection).toContain('!plus!^g'); // Hi-hat
      expect(handsSection).toContain('!accent!c'); // Accented snare
    });

    it('应该正确合并连续休止符', () => {
      const grid = createTestGrid(
        // Kick: 位置 0, 8
        Array(16).fill(null).map((_, i) => [0, 8].includes(i) ? createNote(true, 'normal') : createNote(false)),
        Array(16).fill(null).map(() => createNote(false)),
        Array(16).fill(null).map(() => createNote(false))
      );

      const result = generateAbcOriginal(grid, 16, 1);

      // 应该包含合并的休止符（如 z8）
      expect(result).toMatch(/z\d+/);
    });
  });

  describe('两个生成器的音符内容对比', () => {
    it('应该生成相同的 Kick 音符序列（Rock 节奏）', () => {
      const hihatClosed = Array(16).fill(null).map((_, i) => createNote(true, 'normal'));
      const snare = Array(16).fill(null).map((_, i) =>
        [2, 4, 13].includes(i) ? createNote(true, 'accent', 127) : createNote(false)
      );
      const kick = Array(16).fill(null).map((_, i) =>
        [0, 9].includes(i) ? createNote(true, 'normal') : createNote(false)
      );

      const grid = createTestGrid(kick, snare, hihatClosed);

      const abcjsResult = generateAbc(grid, 16, 1);
      const abc2svgResult = generateAbcOriginal(grid, 16, 1, 80);

      // abcjs: 检查整个输出中的 Kick 音符
      const abcjsKickCount = (abcjsResult.match(/F/g) || []).length;
      expect(abcjsKickCount).toBe(2); // Rock 节奏有 2 个 kick

      // abc2svg: 只检查脚声部（[V:Feet]）中的 Kick 音符
      const feetSection = abc2svgResult.split('[V:Feet]')[1].split('[V:Hands]')[0];
      const abc2svgKickCount = (feetSection.match(/F/g) || []).length;
      expect(abc2svgKickCount).toBe(2); // Rock 节奏有 2 个 kick

      // 验证两个生成器产生的 Kick 音符数量一致
      expect(abcjsKickCount).toBe(abc2svgKickCount);
    });

    it('应该生成相同的 Snare 音符序列（Rock 节奏）', () => {
      const hihatClosed = Array(16).fill(null).map((_, i) => createNote(true, 'normal'));
      const snare = Array(16).fill(null).map((_, i) =>
        [2, 4, 13].includes(i) ? createNote(true, 'accent', 127) : createNote(false)
      );
      const kick = Array(16).fill(null).map((_, i) =>
        [0, 9].includes(i) ? createNote(true, 'normal') : createNote(false)
      );

      const grid = createTestGrid(kick, snare, hihatClosed);

      const abcjsResult = generateAbc(grid, 16, 1);
      const abc2svgResult = generateAbcOriginal(grid, 16, 1, 80);

      // abcjs: 查找实际的军鼓音符（包含 accent 标记）
      const abcjsAccentCount = (abcjsResult.match(/!>!c/g) || []).length;
      expect(abcjsAccentCount).toBe(3); // Rock 节奏有 3 个 accent snare

      // abc2svg: 查找实际的军鼓音符（包含 accent 标记）
      const abc2svgAccentCount = (abc2svgResult.match(/!accent!c/g) || []).length;
      expect(abc2svgAccentCount).toBe(3); // Rock 节奏有 3 个 accent snare

      // 验证两个生成器产生的军鼓数量一致
      expect(abcjsAccentCount).toBe(abc2svgAccentCount);
    });

    it('应该生成相同的 Hi-hat 音符序列（Rock 节奏）', () => {
      const hihatClosed = Array(16).fill(null).map((_, i) => createNote(true, 'normal'));
      const snare = Array(16).fill(null).map((_, i) =>
        [2, 4, 13].includes(i) ? createNote(true, 'accent', 127) : createNote(false)
      );
      const kick = Array(16).fill(null).map((_, i) =>
        [0, 9].includes(i) ? createNote(true, 'normal') : createNote(false)
      );

      const grid = createTestGrid(kick, snare, hihatClosed);

      const abcjsResult = generateAbc(grid, 16, 1);
      const abc2svgResult = generateAbcOriginal(grid, 16, 1, 80);

      // abcjs: 检查整个输出中的 Hi-hat 音符
      const abcjsHihatCount = (abcjsResult.match(/\^g/g) || []).length;
      expect(abcjsHihatCount).toBe(16); // Rock 节奏有 16 个 hi-hat

      // abc2svg: 只检查手声部（[V:Hands]）中的 Hi-hat 音符
      const handsSection = abc2svgResult.split('[V:Hands]')[1];
      const abc2svgHihatCount = (handsSection.match(/\^g/g) || []).length;
      expect(abc2svgHihatCount).toBe(16); // Rock 节奏有 16 个 hi-hat

      // 验证两个生成器产生的 Hi-hat 音符数量一致
      expect(abcjsHihatCount).toBe(abc2svgHihatCount);
    });

    it('应该正确处理重音标记', () => {
      const hihatClosed = Array(16).fill(null).map((_, i) => createNote(true, 'normal'));
      const snare = Array(16).fill(null).map((_, i) =>
        [2, 4, 13].includes(i) ? createNote(true, 'accent', 127) : createNote(false)
      );
      const kick = Array(16).fill(null).map((_, i) =>
        [0, 9].includes(i) ? createNote(true, 'normal') : createNote(false)
      );

      const grid = createTestGrid(kick, snare, hihatClosed);

      const abcjsResult = generateAbc(grid, 16, 1);
      const abc2svgResult = generateAbcOriginal(grid, 16, 1, 80);

      // abcjs 使用 !>! 作为重音标记
      expect(abcjsResult).toContain('!>!');
      expect(abcjsResult.match(/!>!/g) || []).toHaveLength(3); // 3 个 accent

      // abc2svg 使用 !accent! 作为重音标记
      expect(abc2svgResult).toContain('!accent!');
      expect(abc2svgResult.match(/!accent!/g) || []).toHaveLength(3); // 3 个 accent
    });

    it('应该正确处理 ghost note', () => {
      const grid = createTestGrid(
        Array(4).fill(null).map(() => createNote(false)),
        // Snare: 位置 0 为 ghost note
        Array(4).fill(null).map((_, i) => i === 0 ? createNote(true, 'ghost', 60) : createNote(false)),
        Array(4).fill(null).map(() => createNote(false))
      );

      const abcjsResult = generateAbc(grid, 4, 1);
      const abc2svgResult = generateAbcOriginal(grid, 4, 1);

      // 两个版本都应该包含 ghost note 标记
      expect(abcjsResult).toContain('!(.!!)!c');
      expect(abc2svgResult).toContain('!(.!!).!c');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空网格（全休止符）', () => {
      const emptyGrid = createTestGrid(
        Array(16).fill(null).map(() => createNote(false)),
        Array(16).fill(null).map(() => createNote(false)),
        Array(16).fill(null).map(() => createNote(false))
      );

      const abcjsResult = generateAbc(emptyGrid, 16, 1);
      const abc2svgResult = generateAbcOriginal(emptyGrid, 16, 1);

      // 两个版本都应该包含休止符
      expect(abcjsResult).toContain('z');
      expect(abc2svgResult).toContain('z');
    });

    it('应该处理单个音符', () => {
      const grid = createTestGrid(
        Array(4).fill(null).map((_, i) => i === 0 ? createNote(true, 'normal') : createNote(false)),
        Array(4).fill(null).map(() => createNote(false)),
        Array(4).fill(null).map(() => createNote(false))
      );

      const abcjsResult = generateAbc(grid, 4, 1);
      const abc2svgResult = generateAbcOriginal(grid, 4, 1);

      // abcjs: 检查整个输出中的底鼓音符
      const abcjsKickCount = (abcjsResult.match(/F/g) || []).length;
      expect(abcjsKickCount).toBe(1);

      // abc2svg: 只检查脚声部（[V:Feet]）中的底鼓音符
      const feetSection = abc2svgResult.split('[V:Feet]')[1].split('[V:Hands]')[0];
      const abc2svgKickCount = (feetSection.match(/F/g) || []).length;
      expect(abc2svgKickCount).toBe(1);
    });

    it('应该处理多个乐器同时发声（和弦）', () => {
      const grid = createTestGrid(
        Array(4).fill(null).map((_, i) => i === 0 ? createNote(true, 'normal') : createNote(false)),
        Array(4).fill(null).map((_, i) => i === 0 ? createNote(true, 'accent') : createNote(false)),
        Array(4).fill(null).map((_, i) => i === 0 ? createNote(true, 'normal') : createNote(false))
      );

      const abcjsResult = generateAbc(grid, 4, 1);
      const abc2svgResult = generateAbcOriginal(grid, 4, 1);

      // abcjs 应该包含和弦
      expect(abcjsResult).toContain('[');

      // abc2svg 手声部应该包含和弦
      const handsSection = abc2svgResult.split('[V:Hands]')[1];
      expect(handsSection).toContain('[');
    });

    it('应该处理所有乐器类型', () => {
      const grid = createTestGrid(
        Array(16).fill(null).map((_, i) => i === 0 ? createNote(true, 'normal') : createNote(false)), // Kick
        Array(16).fill(null).map((_, i) => i === 4 ? createNote(true, 'accent') : createNote(false)), // Snare
        Array(16).fill(null).map((_, i) => i < 8 ? createNote(true, 'normal') : createNote(false)), // Hi-hat Closed
        Array(16).fill(null).map((_, i) => i === 8 ? createNote(true, 'normal') : createNote(false)), // Hi-hat Open
        Array(16).fill(null).map((_, i) => i === 12 ? createNote(true, 'normal') : createNote(false)), // High Tom
        Array(16).fill(null).map((_, i) => i === 14 ? createNote(true, 'accent') : createNote(false)) // Floor Tom
      );

      const abcjsResult = generateAbc(grid, 16, 1);
      const abc2svgResult = generateAbcOriginal(grid, 16, 1);

      // 验证所有乐器都出现在 abcjs 结果中
      expect(abcjsResult).toContain('F'); // Kick
      expect(abcjsResult).toContain('c'); // Snare
      expect(abcjsResult).toContain('^g'); // Hi-hat
      expect(abcjsResult).toContain('e'); // High Tom
      expect(abcjsResult).toContain('A'); // Floor Tom

      // 验证所有乐器都出现在 abc2svg 结果中
      expect(abc2svgResult).toContain('F'); // Kick
      expect(abc2svgResult).toContain('c'); // Snare
      expect(abc2svgResult).toContain('^g'); // Hi-hat
      expect(abc2svgResult).toContain('e'); // High Tom
      expect(abc2svgResult).toContain('A'); // Floor Tom
    });
  });
});
