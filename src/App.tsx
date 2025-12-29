import { ChatInterface } from './components/ChatInterface';
import { DrumGrid } from './components/DrumGrid';
import { ScoreRenderer } from './components/ScoreRenderer';
import { TransportControls } from './components/TransportControls';
import { useEffect } from 'react';

function App() {
  // Enforce dark mode by default for that "Cursor" feel, or follow system
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Sidebar - Chat (Agent) */}
      <div className="w-[380px] shrink-0 h-full border-r border-border bg-muted/10 z-20">
        <ChatInterface />
      </div>

      {/* Main Content - Preview & Editor */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background/50">
        
        {/* Top Bar - Transport */}
        <TransportControls />

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
          
          {/* Section 1: Sheet Music Preview */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Live Notation</h2>
              <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">Generated via abcjs</span>
            </div>
            <ScoreRenderer />
          </section>

          {/* Section 2: Grid Editor */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Sequencer Grid</h2>
            <DrumGrid />
          </section>

        </div>
      </div>
    </div>
  );
}

export default App;
