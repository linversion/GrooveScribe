import { ChatInterface } from './components/ChatInterface';
import { DrumGrid } from './components/DrumGrid';
import { ScoreRenderer } from './components/ScoreRenderer';
import { TransportControls } from './components/TransportControls';

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cursor-bg text-cursor-text font-sans">
      {/* Sidebar - Chat (Agent) */}
      <div className="w-[400px] shrink-0 h-full">
        <ChatInterface />
      </div>

      {/* Main Content - Preview & Editor */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Bar - Transport */}
        <TransportControls />

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Section 1: Sheet Music Preview */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Live Preview (ABC Notation)</h2>
            <div className="border border-cursor-border rounded-lg shadow-lg">
              <ScoreRenderer />
            </div>
          </section>

          {/* Section 2: Grid Editor */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Sequencer Grid</h2>
            <DrumGrid />
          </section>

        </div>
      </div>
    </div>
  );
}

export default App;
