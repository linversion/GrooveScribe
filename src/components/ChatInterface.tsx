import { useState } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useDrumStore } from '../store/useDrumStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <Card className="h-full flex flex-col border-r-0 rounded-none bg-background border-border">
      {/* Header */}
      <CardHeader className="py-4 px-5 border-b border-border bg-muted/20 backdrop-blur supports-[backdrop-filter]:bg-muted/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-primary animate-pulse-subtle" />
             AI Agent
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-normal px-2.5 py-1">
            Cursor-Drum-v1
          </Badge>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-5">
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={clsx(
                  "flex gap-3 text-sm animate-fade-in",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={clsx(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 shadow-sm",
                  msg.role === 'agent'
                    ? "bg-primary text-primary-foreground border-primary/50"
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  {msg.role === 'agent' ? <Bot size={17} /> : <User size={17} />}
                </div>
                <div className={clsx(
                  "max-w-[85%] p-4 rounded-xl leading-relaxed whitespace-pre-wrap shadow-md",
                  msg.role === 'agent'
                    ? "bg-muted/50 text-foreground border border-border/50"
                    : "bg-primary text-primary-foreground border-2 border-primary/50"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 text-sm animate-fade-in">
                 <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 border-2 border-primary/50 shadow-md animate-pulse">
                   <Bot size={17} className="text-primary-foreground" />
                 </div>
                 <div className="bg-muted/50 p-4 rounded-xl text-muted-foreground text-xs border border-border/50 shadow-sm flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <CardFooter className="p-5 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full space-y-3">
          <div className="flex gap-2">
            <Input
              className="flex-1 h-11 px-4 text-sm focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ask AI to edit the groove..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-11 w-11 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Send size={17} />
            </Button>
          </div>
          <div className="flex justify-between px-1 text-[10px] text-muted-foreground font-medium">
            <span>Try: "Rock", "Disco", "Clear"</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/50">Enter</kbd>
              to send
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
