import { Instrument, Note } from '../store/useDrumStore';

// 将网格数据转换为 ABC 记谱法字符串
// 参考: http://abcnotation.com/

const ABC_MAP: Record<Instrument, Record<string, string>> = {
  kick: { normal: 'F', accent: '!>!F', ghost: 'F' }, // ABC 通常底鼓在 F 位置
  snare: { normal: 'c', accent: '!>!c', ghost: '!(.!!)!c' }, // 军鼓在 c 位置
  hihat_closed: { normal: '^g', accent: '!>!^g', ghost: '^g' }, // 闭镲 g#
  hihat_open: { normal: '!open!^g', accent: '!>!!open!^g', ghost: '!open!^g' },
  tom_high: { normal: 'e', accent: '!>!e', ghost: 'e' },
  tom_floor: { normal: 'A', accent: '!>!A', ghost: 'A' }
};

export const generateAbc = (
  gridData: Record<Instrument, Note[]>, 
  stepsPerMeasure: number,
  totalMeasures: number
): string => {
  let abc = 'X:1\n';
  abc += 'T:Generated Groove\n';
  abc += 'M:4/4\n'; // 暂时硬编码 4/4
  abc += 'L:1/16\n'; // 默认 16分音符单位
  abc += 'K:C perc\n'; // 打击乐谱号
  
  // 我们需要遍历每个 Step，将所有乐器组合成一个 chord 或 单音
  const totalSteps = stepsPerMeasure * totalMeasures;
  
  let measureStr = '';
  
  for (let i = 0; i < totalSteps; i++) {
    const activeNotes: string[] = [];
    
    // 检查这个 Step 有哪些乐器发声
    (Object.keys(gridData) as Instrument[]).forEach(inst => {
      const note = gridData[inst][i];
      if (note.active) {
        const mapping = ABC_MAP[inst][note.articulation] || ABC_MAP[inst]['normal'];
        activeNotes.push(mapping);
      }
    });

    if (activeNotes.length === 0) {
      measureStr += 'z'; // 休止符
    } else if (activeNotes.length === 1) {
      measureStr += activeNotes[0];
    } else {
      measureStr += `[${activeNotes.join('')}]`; // 和弦
    }
    
    // 添加小节线
    if ((i + 1) % stepsPerMeasure === 0) {
      measureStr += ' | ';
    } else if ((i + 1) % 4 === 0) {
      measureStr += ' '; // 每拍加个空格方便阅读
    }
  }

  abc += measureStr;
  return abc;
};
