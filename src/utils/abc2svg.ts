/**
 * abc2svg 渲染器的 TypeScript 包装器
 * 提供类型安全的 API 来使用 abc2svg 库
 */

// 扩展 Window 接口以包含 abc2svg
declare global {
  interface Window {
    Abc: any; // abc2svg 的全局构造函数
  }
}

export interface Abc2svgOptions {
  /** 缩放比例 */
  scale?: number;
  /** 五线谱宽度 */
  staffwidth?: number;
  /** 顶部内边距 */
  paddingtop?: number;
  /** 底部内边距 */
  paddingbottom?: number;
  /** 右侧内边距 */
  paddingright?: number;
  /** 左侧内边距 */
  paddingleft?: number;
}

/**
 * abc2svg 回调对象
 * 用于接收渲染输出
 */
class Abc2svgCallback {
  abc_svg_output = '';
  abc_error_output = '';

  // 必需的方法
  read_file = (fn: string) => ''; // 处理 %%abc-include 指令
  errmsg = (msg: string, line: number, col: number) => {
    this.abc_error_output += msg + '<br/>\n';
  };
  img_out = (str: string) => {
    this.abc_svg_output += str;
  };

  // 可选的方法
  get_abcmodel = (_tsfirst: any, _voice_tb: any, _music_types: any) => {};
  anno_start = (_type: string, _start: any, _stop: any, _x: number, _y: number, _w: number, _h: number) => {};
  anno_stop = (_type: string, _start: any, _stop: any, _x: number, _y: number, _w: number, _h: number) => {};

  // 可选属性
  page_format = true;
}

/**
 * 使用 abc2svg 渲染 ABC 记谱法
 * @param container - 容器元素
 * @param abcString - ABC 记谱法字符串
 * @returns SVG 元素
 */
export const renderAbc = (
  container: HTMLElement,
  abcString: string,
  _options?: Abc2svgOptions // 保留参数以兼容接口，但不使用
): SVGElement => {
  // 检查 abc2svg 库是否已加载
  if (typeof window.Abc === 'undefined') {
    throw new Error(
      'abc2svg library not loaded. Make sure /lib/abc2svg-1.js is included in index.html'
    );
  }

  try {
    // 创建回调对象
    const callback = new Abc2svgCallback();

    // 创建 abc2svg 实例，传入回调
    const abcObj = new window.Abc(callback);

    // 清空输出
    callback.abc_svg_output = '';
    callback.abc_error_output = '';

    // 直接使用 ABC 字符串，不添加额外的格式化指令
    // 原版 GrooveScribe 也没有使用这些指令
    const abcSource = abcString;

    // 渲染 ABC 为 SVG（使用 tosvg 方法）
    abcObj.tosvg('SOURCE', abcSource);

    // 检查是否有错误
    if (callback.abc_error_output) {
      console.error('abc2svg errors:', callback.abc_error_output);
    }

    // 清空容器并添加 SVG
    container.innerHTML = callback.abc_svg_output;

    // 返回第一个 SVG 元素
    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element generated');
    }

    return svgElement;
  } catch (error) {
    console.error('abc2svg rendering error:', error);
    throw error;
  }
};
