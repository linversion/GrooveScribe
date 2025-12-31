import { Instrument, Note } from '../store/useDrumStore';

/**
 * 原版 GrooveScribe 风格的 ABC 生成器
 * 使用原版的鼓谱符号映射，与 abc2svg 兼容
 */

// 鼓谱符号映射（来自原版 GrooveScribe）
const constant_ABC_KI_Normal = "F";          // Kick
const constant_ABC_KI_Accent = "!accent!F";
const constant_ABC_SN_Normal = "c";          // Snare
const constant_ABC_SN_Accent = "!accent!c";
const constant_ABC_SN_Ghost = "!(.!!).!c";   // Ghost note
const constant_ABC_HH_Normal = "!plus!^g";   // Closed Hi-hat
const constant_ABC_HH_Accent = "!accent!^g";
const constant_ABC_HH_Open = "!open!^g";     // Open Hi-hat
const constant_ABC_T1_Normal = "e";          // High Tom
const constant_ABC_T1_Accent = "!accent!e";
const constant_ABC_T2_Normal = "d";          // Mid Tom 2
const constant_ABC_T3_Normal = "B";          // Mid Tom 3
const constant_ABC_T4_Normal = "A";          // Floor Tom
const constant_ABC_T4_Accent = "!accent!A";

/**
 * 生成原版风格的 ABC 记谱法字符串
 * 与原版 GrooveScribe 的 abc2svg 渲染器兼容
 */
export const generateAbcOriginal = (
  gridData: Record<Instrument, Note[]>,
  stepsPerMeasure: number,
  totalMeasures: number,
  bpm?: number
): string => {
  // ABC 头部信息（使用原版格式）
  let abc = '%abc\n';
  abc += '%%fullsvg _1\n';
  abc += 'X:6\n';
  abc += `M:4/4\n`;
  abc += `T:Generated Groove\n`;
  if (bpm) {
    abc += `Q:1/4=${bpm}\n`;
  }
  abc += 'L:1/16\n';
  abc += '%%scale 1.4\n'; // 缩放比例（从 1.0 增加到 1.4）
  abc += '%%stretchlast 1\n';
  abc += '%%flatbeams 1\n';
  abc += '%%ornament up\n';

  // SVG 定义（鼓谱符号）
  abc += '%%beginsvg\n';
  abc += ' <defs>\n';
  abc += ' <path id="Xhead" d="m-3,-3 l6,6 m0,-6 l-6,6" class="stroke" style="stroke-width:1.2"/>\n';
  abc += ' <path id="Trihead" d="m-3,2 l 6,0 l-3,-6 l-3,6 l6,0" class="stroke" style="stroke-width:1.2"/>\n';
  abc += ' </defs>\n';
  abc += '%%endsvg\n';

  // 鼓谱符号映射
  abc += '%%map drum ^g heads=Xhead print=g       % Hi-Hat\n';
  abc += '%%map drum ^c\' heads=Xhead print=c\'   % Crash\n';
  abc += '%%map drum ^d\' heads=Xhead print=d\'   % Stacker\n';
  abc += '%%map drum ^e\' heads=Xhead print=e\'   % Metronome click\n';
  abc += '%%map drum ^f\' heads=Xhead print=f\'   % Metronome beep\n';
  abc += '%%map drum ^A\' heads=Xhead print=A\'   % Ride\n';
  abc += '%%map drum ^B\' heads=Trihead print=A\' % Ride Bell\n';
  abc += '%%map drum ^D\' heads=Trihead print=g   % Cow Bell\n';
  abc += '%%map drum ^c heads=Xhead print=c  % Cross Stick\n';
  abc += '%%map drum ^d, heads=Xhead print=d,  % Foot Splash\n';

  // 声部定义（使用圆括号）
  abc += '%%staves (Stickings Hands Feet)\n';
  abc += 'K:C clef=perc\n';

  abc += 'V:Stickings\n';
  abc += 'V:Hands stem=up\n';
  abc += '%%voicemap drum\n';
  abc += 'V:Feet stem=down\n';
  abc += '%%voicemap drum\n';

  const totalSteps = stepsPerMeasure * totalMeasures;

  // 生成 Stickings 声部（空，使用隐藏休止符）
  abc += '%Stickings\n';
  abc += '[V:Stickings] ';
  // 每4个16分音符合并为一个隐藏休止符（x4 = 一拍）
  for (let i = 0; i < totalSteps; i += 4) {
    abc += 'x4'; // 隐藏的休止符，不会显示在五线谱上
    if ((i + 4) % stepsPerMeasure === 0) {
      abc += ' |';
    } else {
      abc += ' ';
    }
  }
  abc += '\n';

  // 生成脚声部（底鼓）
  abc += '%Feet\n';
  abc += '[V:Feet] ';

  let restCount = 0; // 连续休止符计数
  for (let i = 0; i < totalSteps; i++) {
    const kickNote = gridData.kick[i];

    if (kickNote.active) {
      // 先输出之前的休止符（如果有）
      if (restCount > 0) {
        abc += `z${restCount}`;
        restCount = 0;
      }

      // 输出音符
      if (kickNote.articulation === 'accent') {
        abc += constant_ABC_KI_Accent;
      } else {
        abc += constant_ABC_KI_Normal;
      }
    } else {
      restCount++;
    }

    // 小节线和空格
    if ((i + 1) % stepsPerMeasure === 0) {
      // 输出剩余的休止符
      if (restCount > 0) {
        abc += `z${restCount}`;
        restCount = 0;
      }
      abc += ' |';
    } else if ((i + 1) % 4 === 0) {
      // 每拍结束，输出休止符并加空格
      if (restCount > 0) {
        abc += `z${restCount}`;
        restCount = 0;
      }
      abc += ' ';
    }
  }

  abc += '\n';

  // 生成手声部（军鼓、镲、通鼓）
  abc += '%Hands\n';
  abc += '[V:Hands] ';

  // 收集所有激活的手部乐器
  const handInstruments: Instrument[] = [
    'hihat_closed',
    'hihat_open',
    'snare',
    'tom_high',
    'tom_floor'
  ];

  for (let i = 0; i < totalSteps; i++) {
    const activeNotes: string[] = [];

    handInstruments.forEach(inst => {
      const note = gridData[inst][i];
      if (note.active) {
        let symbol = '';
        switch (inst) {
          case 'hihat_closed':
            symbol = note.articulation === 'accent'
              ? constant_ABC_HH_Accent
              : constant_ABC_HH_Normal;
            break;
          case 'hihat_open':
            symbol = constant_ABC_HH_Open;
            break;
          case 'snare':
            if (note.articulation === 'accent') {
              symbol = constant_ABC_SN_Accent;
            } else if (note.articulation === 'ghost') {
              symbol = constant_ABC_SN_Ghost;
            } else {
              symbol = constant_ABC_SN_Normal;
            }
            break;
          case 'tom_high':
            symbol = note.articulation === 'accent'
              ? constant_ABC_T1_Accent
              : constant_ABC_T1_Normal;
            break;
          case 'tom_floor':
            symbol = note.articulation === 'accent'
              ? constant_ABC_T4_Accent
              : constant_ABC_T4_Normal;
            break;
        }
        activeNotes.push(symbol);
      }
    });

    if (activeNotes.length === 0) {
      abc += 'z'; // 使用休止符填充，保持节奏
    } else if (activeNotes.length === 1) {
      abc += activeNotes[0];
    } else {
      // 和弦（多个乐器同时发声）
      abc += `[${activeNotes.join('')}]`;
    }

    // 小节线和空格
    if ((i + 1) % stepsPerMeasure === 0) {
      abc += ' |';
    } else if ((i + 1) % 4 === 0) {
      abc += ' ';
    }
  }
  abc += '\n';

  // 调试：打印生成的 ABC
  console.log('[abcGeneratorOriginal] Generated ABC:\n', abc);

  return abc;
};
