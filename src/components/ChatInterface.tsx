import { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useDrumStore } from '../store/useDrumStore';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'agent', 
      content: '我是你的 AI 鼓手助手。我可以帮你生成节奏、修改鼓谱或回答音乐相关问题。\n\n试着对我说："生成一个 Funky 的节奏" 或 "把踩镲改成 16 分音符"。' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const { clearGrid, toggleNote } = useDrumStore();

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response Logic
    setTimeout(() => {
      let responseText = "我收到了你的请求。由于我只是一个前端演示原型，我无法真正调用 LLM 来修改 Store。";
      
      // Simple Keyword Matching for Demo
      const lowerInput = userMsg.content.toLowerCase();
      
      if (lowerInput.includes('clear') || lowerInput.includes('清空')) {
        clearGrid();
        responseText = "已清空鼓谱。";
      } else if (lowerInput.includes('rock') || lowerInput.includes('摇滚')) {
        clearGrid();
        // Basic Rock Beat
        [0, 4, 8, 12].forEach(s => toggleNote('hihat_closed', s));
        [2, 6, 10, 14].forEach(s => toggleNote('hihat_closed', s));
        [0, 8].forEach(s => toggleNote('kick', s));
        [4, 12].forEach(s => toggleNote('snare', s));
        responseText = "已生成一个基础摇滚节奏 (Rock Beat)。";
      } else if (lowerInput.includes('disco') || lowerInput.includes('迪斯科')) {
        clearGrid();
        // Disco Beat
        [0, 2, 4, 6, 8, 10, 12, 14].forEach(s => toggleNote('hihat_closed', s));
        [2, 6, 10, 14].forEach(s => toggleNote('hihat_open', s)); // Open on off-beats
        [0, 4, 8, 12].forEach(s => toggleNote('kick', s)); // Four on the floor
        [4, 12].forEach(s => toggleNote('snare', s));
        responseText = "已生成 Disco 节奏，感受那个 Four-on-the-floor 吧！";
      }

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'agent', 
        content: responseText 
      }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-cursor-sidebar border-r border-cursor-border">
      {/* Header */}
      <div className="p-4 border-b border-cursor-border flex items-center justify-between">
        <span className="font-semibold text-sm flex items-center gap-2">
           <Sparkles className="w-4 h-4 text-cursor-accent" />
           AI Agent
        </span>
        <span className="text-xs text-gray-500 bg-cursor-bg px-2 py-1 rounded-full">Model: Cursor-Drum-v1</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={clsx("flex gap-3 text-sm", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'agent' ? "bg-cursor-accent text-white" : "bg-gray-600 text-white"
            )}>
              {msg.role === 'agent' ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={clsx(
              "max-w-[80%] p-3 rounded-lg leading-relaxed whitespace-pre-wrap",
              msg.role === 'agent' ? "bg-cursor-bg text-cursor-text" : "bg-blue-600 text-white"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 text-sm">
             <div className="w-8 h-8 rounded-full bg-cursor-accent flex items-center justify-center shrink-0">
               <Bot size={16} className="animate-pulse" />
             </div>
             <div className="bg-cursor-bg p-3 rounded-lg text-gray-400">Thinking...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-cursor-border bg-cursor-bg">
        <div className="relative">
          <input
            type="text"
            className="w-full bg-cursor-input text-cursor-text rounded-md pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cursor-accent border border-cursor-border"
            placeholder="Ask AI to edit the groove..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 text-[10px] text-gray-500 flex justify-between px-1">
          <span>Supported commands: "Rock", "Disco", "Clear"</span>
          <span>Enter to send</span>
        </div>
      </div>
    </div>
  );
};
