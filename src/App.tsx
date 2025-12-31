import { ChatInterface } from './components/ChatInterface';
import { DrumGrid } from './components/DrumGrid';
import { ScoreRenderer } from './components/ScoreRenderer';
import { TransportControls } from './components/TransportControls';
import { DevDebugPanel } from './components/DevDebugPanel';
import { useEffect } from 'react';

function App() {
  // 强制暗色模式以获得 "Cursor" 的感觉，或跟随系统
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* 侧边栏 - AI 聊天 */}
      <div className="w-[400px] shrink-0 h-full border-r border-border bg-muted/5 z-20">
        <ChatInterface />
      </div>

      {/* 主内容区 - 预览和编辑器 */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-gradient-to-br from-background via-background to-muted/5">

        {/* 顶部栏 - 播放控制 */}
        <TransportControls />

        {/* 可滚动区域 */}
        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 scroll-smooth">

          {/* 区域 1: 五线谱预览 */}
          <section className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Live Notation
                </h2>
                <p className="text-xs text-muted-foreground">实时生成的鼓谱五线谱显示</p>
              </div>
              <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-3 py-1.5 rounded-lg border border-border/50">
                Powered by abcjs
              </span>
            </div>
            <ScoreRenderer />
          </section>

          {/* 区域 2: 网格编辑器 */}
          <section className="space-y-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Sequencer Grid
              </h2>
              <p className="text-xs text-muted-foreground">点击网格添加或删除音符，实时编辑鼓节奏</p>
            </div>
            <DrumGrid />
          </section>

        </div>
      </div>

      {/* 开发环境调试面板 */}
      {import.meta.env.DEV && <DevDebugPanel />}
    </div>
  );
}

export default App;
