# 问题排查指南

本文档记录了在实现双渲染器支持过程中遇到的所有问题及其解决方案。

## 目录
1. [五线谱渲染差异](#五线谱渲染差异)
2. [abc2svg 库加载问题](#abc2svg-库加载问题)
3. [渲染器颜色适配](#渲染器颜色适配)
4. [音符位置错误](#音符位置错误)
5. [休止符显示问题](#休止符显示问题)

---

## 五线谱渲染差异

### 问题描述
改进版的五线谱渲染效果与原版差异太大：
- **改进版**：使用 abcjs，符号简单，缺少专业鼓谱符号
- **原版**：使用 abc2svg，多声部，完整鼓谱符号

### 根本原因
1. **使用不同的渲染库**
   - 改进版：abcjs（现代 ABC 库）
   - 原版：abc2svg（专业鼓谱渲染，2015）

2. **ABC 记谱法格式差异**
   - ❌ 缺少格式化指令（`%%flatbeams`, `%%ornament` 等）
   - ❌ 鼓谱符号映射不标准（`!>!` vs `!accent!`）
   - ❌ 单声部而非多声部
   - ❌ 缺少鼓谱符号映射表（`%%map drum`）

### 解决方案
**采用双渲染器架构**：
1. ✅ 保留 abcjs 作为默认渲染器
2. ✅ 集成 abc2svg 作为备选渲染器
3. ✅ 添加切换按钮，用户可自由选择
4. ✅ 创建原版风格的 ABC 生成器

**实施步骤**：
1. 复制 abc2svg-1.js 到 `public/lib/`
2. 创建 `abc2svg.ts` 包装器
3. 创建 `abcGeneratorOriginal.ts` 使用原版格式
4. 扩展 Store 添加 `renderer` 状态
5. 更新 ScoreRenderer 支持双渲染器
6. 创建 RendererToggle 组件

### 关键代码

**abc2svg 包装器**：
```typescript
class Abc2svgCallback {
  abc_svg_output = '';
  img_out = (str: string) => { this.abc_svg_output += str; };
  // ... 其他必需方法
}

export const renderAbc = (container: HTMLElement, abcString: string) => {
  const callback = new Abc2svgCallback();
  const abcObj = new window.Abc(callback);
  abcObj.tosvg('SOURCE', abcString);
  container.innerHTML = callback.abc_svg_output;
};
```

---

## abc2svg 库加载问题

### 问题描述 1: "abc2svg library not loaded"
**错误信息**：
```
渲染器错误: abc2svg library not loaded. Make sure /lib/abc2svg-1.js is included in index.html
```

**原因**：API 使用错误
- 使用了 `window.abc2svg.Abc`（不存在）
- 实际 API 是全局 `Abc` 构造函数

**解决方案**：
```typescript
// ❌ 错误
if (!window.abc2svg) { ... }
const AbcConstructor = window.abc2svg.Abc;

// ✅ 正确
if (typeof window.Abc === 'undefined') {
  throw new Error('abc2svg library not loaded');
}
const abcObj = new window.Abc();
```

### 问题描述 2: "file.indexOf is not a function"
**错误信息**：
```
渲染器错误: file.indexOf is not a function
```

**原因**：
1. ❌ 错误的 API 调用方式
2. ❌ 缺少回调对象

**解决方案**：
abc2svg 需要回调对象来接收 SVG 输出：

```typescript
class Abc2svgCallback {
  abc_svg_output = '';
  abc_error_output = '';

  img_out = (str: string) => {
    this.abc_svg_output += str;
  };

  errmsg = (msg: string, line: number, col: number) => {
    this.abc_error_output += msg + '<br/>\n';
  };

  read_file = (fn: string) => '';

  page_format = true;
}

// 使用回调
const callback = new Abc2svgCallback();
const abcObj = new window.Abc(callback);
abcObj.tosvg('SOURCE', abcSource);
```

### 问题描述 3: "'staffwidth' too big"
**错误信息**：
```
abc2svg errors: SOURCE:2:1 Error: 'staffwidth' too big
```

**原因**：
- 使用了 `%%staffwidth 900` 等格式化指令
- abc2svg 对这些参数有严格限制

**解决方案**：
移除这些格式化指令，使用默认配置：
```typescript
// ❌ 错误
let abcSource = `%%scale ${scale}\n`;
abcSource += `%%staffwidth ${staffwidth}\n`;
// ...

// ✅ 正确
const abcSource = abcString; // 直接使用 ABC，不添加额外指令
```

---

## 渲染器颜色适配

### 问题描述
abc2svg 渲染的鼓谱颜色固定为黑色，在暗色模式下不可见。

### 原因
abc2svg 生成的 SVG 包含 `color="black"` 属性。

### 解决方案

#### 方案 1：动态设置 SVG 颜色
```typescript
const updateAbc2svgColor = useCallback(() => {
  const svgElement = container.querySelector('svg');
  if (svgElement) {
    const isDark = document.documentElement.classList.contains('dark');
    const color = isDark ? 'white' : 'black';
    svgElement.setAttribute('color', color);
    (svgElement as HTMLElement).style.color = color;
  }
}, [renderer]);

// 监听主题切换
useEffect(() => {
  const observer = new MutationObserver(() => {
    updateAbc2svgColor();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
  return () => observer.disconnect();
}, [renderer, updateAbc2svgColor]);
```

**要点**：
1. ✅ 检测 `dark` 类判断当前主题
2. ✅ 设置 SVG 的 `color` 属性和 `style.color`
3. ✅ 使用 MutationObserver 监听主题切换
4. ✅ 使用 useCallback 避免无限循环

---

## 音符位置错误

### 问题描述 1: 底鼓位置不对
**症状**：底鼓音符显示在错误的位置。

### 原因分析
使用了错误的音符符号：
- Kick 使用了 `A`（应该用 `F`）
- Floor Tom 使用了 `F`（应该用 `A`）

### 解决方案
恢复正确的音符映射（与原版一致）：
```typescript
// ✅ 正确
const constant_ABC_KI_Normal = "F";          // Kick
const constant_ABC_T4_Normal = "A";          // Floor Tom
```

**音符位置关系**（从低到高）：
- `F` - Kick（底鼓）
- `A` - Floor Tom
- `B` - Mid Tom 3
- `d` - Mid Tom 2
- `e` - High Tom
- `c` - Snare（军鼓）
- `^g` - Hi-hat（镲）

### 问题描述 2: 空格导致节奏错乱
**症状**：Feet 声部显示 `F         F        `，音符位置偏移。

### 原因
使用空格 `' '` 代替休止符 `z`，导致 abc2svg 无法正确解析节奏。

### 解决方案
使用休止符 `z` 填充空位：
```typescript
// ❌ 错误
if (!kickNote.active) {
  abc += ' '; // 导致节奏错乱
}

// ✅ 正确
if (!kickNote.active) {
  abc += 'z'; // 使用休止符
}
```

### 问题描述 3: 默认节奏位置错误
**症状**：Kick 和 Snare 的默认位置与原版不一致。

### 原因
数组索引从 0 开始，但原版 URL 可能从 1 开始计数。

### 解决方案
**原版 URL**：
```
S=|--O-O-------O---|  (从0开始: 位置 2, 4, 13)
K=|o-------o-------|  (从0开始: 位置 0, 9)
```

**正确映射**：
```typescript
// Snare: 位置 2, 4, 13
[2, 4, 13].forEach(step => { ... });

// Kick: 位置 0, 9
[0, 9].forEach(step => { ... });
```

**验证方法**：
1. 打开原版 GrooveScribe
2. 对比 URL 参数和实际渲染结果
3. 确保数组索引匹配（从 0 开始）

---

## 休止符显示问题

### 问题描述
五线谱显示过多 16 分音符休止符，视觉效果混乱。

### 原因
每个 16 分位置都输出独立的 `z` 休止符：
```abc
[V:Feet] zFzz zzzz zFzz zzzz |
```

### 解决方案
**合并连续的休止符**：
```typescript
let restCount = 0;
for (let i = 0; i < totalSteps; i++) {
  if (kickNote.active) {
    // 输出之前的休止符
    if (restCount > 0) {
      abc += `z${restCount}`;
      restCount = 0;
    }
    abc += constant_ABC_KI_Normal;
  } else {
    restCount++;
  }
}
```

**效果对比**：
```abc
// ❌ 之前：每个位置独立
[V:Feet] zFzz zzzz zFzz zzzz |

// ✅ 现在：合并连续休止符
[V:Feet] zF z4 zF z4 |
```

**要点**：
1. ✅ 在节拍结束（每 4 个 16 分音符）时输出休止符
2. ✅ 在音符出现时先输出累积的休止符
3. ✅ 在小节结束时输出剩余休止符

---

## 开发调试技巧

### 1. 查看 abc2svg 生成的 ABC
```typescript
console.log('[abcGeneratorOriginal] Generated ABC:\n', abc);
```

### 2. 对比原版生成的 ABC
```javascript
// 在原版网站控制台
document.getElementById("ABCsource").value
```

### 3. 检查 SVG 输出
```typescript
console.log('[abc2svg] Full SVG output:', callback.abc_svg_output);
```

### 4. 监控主题变化
```typescript
const observer = new MutationObserver(() => {
  console.log('Theme changed!');
  updateAbc2svgColor();
});
```

---

## 常见问题 FAQ

### Q: 为什么保留两个渲染器？
**A**:
- **abcjs**：现代化、易维护、适合新功能
- **abc2svg**：与原版完全一致、专业鼓谱符号
- 用户可以根据需要选择

### Q: 如何选择渲染器？
**A**:
- 如果需要与原版 GrooveScribe 完全一致 → abc2svg
- 如果需要现代化功能 → abcjs

### Q: 默认使用哪个渲染器？
**A**: abcjs（更现代化），但用户选择会持久化

### Q: 两个渲染器的性能如何？
**A**: 都经过验证，性能相当。大乐谱可能需要优化。

---

## 相关资源

### 原版项目
- **仓库**：https://github.com/montulli/GrooveScribe
- **本地路径**：`D:\Claude-Code\GrooveScribe-original`
- **运行端口**：http://localhost:8080

### 改进版项目
- **仓库**：git@github.com:linversion/GrooveScribe.git
- **分支**：develop
- **运行端口**：http://localhost:5173

### 关键文件
- `src/utils/abc2svg.ts` - abc2svg 包装器
- `src/utils/abcGeneratorOriginal.ts` - 原版 ABC 生成
- `src/components/ScoreRenderer.tsx` - 双渲染器实现
- `src/components/RendererToggle.tsx` - 切换按钮

---

## 更新日志
- **2025-12-31**: 初始版本，记录双渲染器实现过程中遇到的所有问题
