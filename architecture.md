# "Cursor for Drums" 技术架构分析报告

## 1. 核心数据结构 (The "State")

### 现状分析：DOM 驱动的状态管理
在当前的代码库中，令人惊讶的是，**并没有一个内存中的 JavaScript 对象作为单一真实数据源**。它采用了一种老旧的 "DOM as State" 模式。

*   **存储方式**：鼓谱的状态直接存储在 HTML 元素的 `style` 属性或 `class` 中。
    *   例如：判断小军鼓（Snare）是否开启，是通过检查 DOM 元素的背景色来实现的：
        ```javascript
        // js/groove_writer.js (Line 200)
        if (document.getElementById("snare_circle" + id).style.backgroundColor == constant_note_on_color_rgb) { ... }
        ```
*   **持久化 (Serialization)**：
    *   虽然运行时依赖 DOM，但它有一套用于 URL 分享和预设加载的序列化格式（在 `js/grooves.js` 中可见）。
    *   格式为自定义的 Query String：
        `?TimeSig=4/4&Div=16&H=|xxxxxxxx|&S=|--O---O-|&K=|o---o--|`
        *   `H`: Hi-Hat, `S`: Snare, `K`: Kick
        *   `x`: 普通音符, `O`: 重音, `-`: 休止符
    *   **二维隐喻**：这实际上是一个压缩的二维矩阵，行是乐器，列是时间步（Tick）。

### 建议：Zustand Store 结构
在 React 重构版中，必须摒弃 DOM 状态，转为内存状态。

```typescript
// 推荐的 Zustand State 结构
type NoteType = 'normal' | 'accent' | 'ghost' | 'flam' | 'drag' | null;

interface DrumGridState {
  meta: {
    tempo: number;
    timeSignature: [number, number]; // e.g., [4, 4]
    subdivision: number; // e.g., 16 (16th notes)
  };
  // 使用 Map 或二维数组存储，Key 为 "InstrumentName-MeasureIndex-StepIndex"
  // 或者更简单的嵌套数组结构：
  grid: {
    [instrument: string]: NoteType[]; // 长度 = measures * subdivision
  };
  
  // Actions
  toggleNote: (instrument: string, step: number) => void;
  setNoteType: (instrument: string, step: number, type: NoteType) => void;
}
```

## 2. 转换引擎 (Transpiler Logic)

### 现状逻辑：Parallel Arrays to String
当前的转换逻辑位于 `generate_ABC` 函数中（`js/groove_writer.js` L2785）。

1.  **Scraping**：首先遍历 DOM，构建出暂时的平行数组（Parallel Arrays）。
    *   `HH_Array`, `Snare_Array`, `Kick_Array` 等，每个数组长度对应总 Time Steps（例如 32 个 32分音符）。
2.  **Merging**：使用 `groove_utils.js` 中的逻辑将这些数组“拉链式”合并。
3.  **Mapping**：
    *   每个乐器对应特定的 ABC 字符（定义在 `groove_utils.js` 全局常量中）：
        *   **Kick (底鼓)**: `F`
        *   **Snare (军鼓)**: `c` (普通), `!accent!c` (重音)
        *   **Hi-Hat (踩镲)**: `^g` (闭镲), `!open!^g` (开镲)
4.  **Chord Generation (关键点)**：
    *   当同一时间步（Step）有多个乐器触发时，ABC 使用方括号 `[]` 包裹形成和弦。
    *   例如：底鼓 + 踩镲 = `[F^g]`。
    *   复杂节奏处理：逻辑倾向于以最小单位（如 32分音符）为基准，如果不发声则输出休止符或延续符，但这通常会导致生成的 ABC 字符串非常冗长（例如大量 `z/2`）。

### 重构思路
你需要编写一个纯函数 `jsonToAbc(state: DrumGridState): string`。

*   **三连音处理**：检测 `subdivision`。如果是 12 或 24，需要在 ABC 中包裹 `(3` 标记。
*   **优化**：不要傻瓜式地每个 Step 都输出。检测连续的休止符进行合并（例如将两个 16分休止符 `z/4 z/4` 合并为 8分休止符 `z/2`），这对 AI 理解和人类阅读都更友好。

## 3. 渲染与可视化 (Rendering Pipeline)

### 现状
*   使用库：`abc2svg-1.js` (这是一个轻量级的 ABC 解析器，生成 SVG)。
*   流程：`refresh_ABC()` -> `generate_ABC()` -> 更新 DOM -> `abc2svg` 重绘 div。

### 推荐方案
*   **库选择**：继续使用 **abcjs** (目前最成熟的 Web ABC 渲染库)。
*   **性能优化**：
    *   **React Memo**：谱面渲染组件 (`ScoreRenderer`) 应该只在 ABC 字符串变化时重渲染。
    *   **虚拟滚动**：如果做了多小节（>10小节），横向滚动时仅渲染可视区域的 SVG。
    *   **Optimistic UI**：用户点击 Grid -> 立即更新 Grid UI -> 异步生成 ABC -> 异步更新谱面。

## 4. AI Agent 集成方案 (The Hook)

### 为什么选择方案 B (AI 修改 Grid JSON)？

1.  **容错性 (Determinism)**：
    *   **方案 A (AI -> ABC String)**：ABC 语法极其脆弱。如果 AI 生成错一个字符（如漏掉 `]`），整个渲染引擎会崩溃或显示乱码。且 AI 很难精准控制“第3小节第2拍的重音”。
    *   **方案 B (AI -> JSON)**：JSON 结构化强。你可以定义 Schema（例如 `zod`），强制 AI 输出 `{ instrument: 'kick', step: 4, type: 'normal' }`。这 100% 可验证、可执行。

2.  **双向编辑 (Bidirectional Editing)**：
    *   用户在 Grid 上点的操作就是修改 JSON。
    *   AI 的操作也是修改 JSON。
    *   两者逻辑统一，互不冲突。

3.  **Agent 介入点**：
    *   在 Zustand Store 中暴露一个 `applyPatch(patch: GridPatch)` 方法。
    *   User Prompt -> LLM -> JSON Patch -> `store.applyPatch()` -> UI 更新。

## 5. 推荐技术栈 (Modern Stack)

这是为你定制的 "Cursor for Drums" 2025 技术栈：

### Core Stack
*   **Framework**: React 18+ (使用 Vite 构建)
*   **Language**: TypeScript (严类型对于音乐逻辑至关重要)
*   **State Manager**: **Zustand** (轻量、高性能，适合处理高频音频状态)
*   **Audio Engine**: **Tone.js** (比原生 Web Audio API 或 MIDI.js 更适合现代编曲，内置了完美的 Scheduler)
*   **Rendering**: **abcjs**

### 核心 Store 定义 (TypeScript Interface)

```typescript
import { create } from 'zustand';
import * as Tone from 'tone';

// 乐器定义
export type Instrument = 'kick' | 'snare' | 'hihat_closed' | 'hihat_open' | 'tom_high' | 'tom_floor';

// 音符属性
export interface Note {
  active: boolean;
  velocity: number; // 0-127, 对应 Tone.js 的 gain
  articulation?: 'accent' | 'ghost' | 'normal';
}

// 核心状态
interface SequencerState {
  // 播放状态
  isPlaying: boolean;
  bpm: number;
  currentStep: number; // 当前播放游标位置
  
  // 网格数据: [Instrument][Step] -> Note
  // 建议使用一维数组 + 步长计算，或嵌套对象
  gridData: Record<Instrument, Note[]>;
  
  // 配置
  stepsPerMeasure: number; // 通常 16
  totalMeasures: number;

  // Actions
  toggleNote: (inst: Instrument, step: number) => void;
  setVelocity: (inst: Instrument, step: number, vel: number) => void;
  play: () => void;
  stop: () => void;
  
  // 计算属性 (用于渲染)
  getAbcString: () => string;
}

// Tone.js 集成思路
// 使用 Tone.Sequence 或 Tone.Part 来绑定 gridData 的变化
// 当 gridData 变化时，debounce 更新 Tone.Sequence 的 events
```
