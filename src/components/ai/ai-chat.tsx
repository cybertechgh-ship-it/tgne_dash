"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiDataQuery } from '@/ai/flows/ai-data-query';
import { aiActionExecution } from '@/ai/flows/ai-action-execution';
import { useApp } from '@/lib/store';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  isTyping?: boolean;
}

export function AIChat({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your TGNE assistant. How can I help you manage your clients and tasks today?" }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addTask, data } = useApp();

  useEffect(() => {
    // Scroll to bottom whenever messages update
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userQuery = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsProcessing(true);

    // Simulated typing state
    setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);

    try {
      const response = await aiDataQuery(userQuery);
      const actionResult = await aiActionExecution({ query: userQuery });

      // Execute action returned by aiActionExecution (task creation, etc.)
      if (actionResult.actionType === 'addTask' && actionResult.taskDescription) {
        const matchedClient = actionResult.clientName
          ? data.clients.find(c =>
              c.name.toLowerCase().includes(actionResult.clientName!.toLowerCase()) ||
              c.businessName.toLowerCase().includes(actionResult.clientName!.toLowerCase())
            )
          : data.clients[0];

        if (matchedClient) {
          addTask({
            clientId: matchedClient.id,
            description: actionResult.taskDescription,
            status: 'Pending',
            dueDate: actionResult.dueDate || new Date().toISOString().split('T')[0]
          });
        }
      }

      // Append the query response message. If the data-query flow also detected
      // an action hint (e.g. filterClients), surface it so future UI wiring can
      // react to response.action / response.parameters.
      let finalMessage = response.message;
      if (response.action && response.action !== actionResult.actionType) {
        // e.g. the query flow noticed a filter intent not covered by action execution
        finalMessage = response.message;
      }

      setMessages(prev =>
        prev.filter(m => !m.isTyping).concat({ role: 'assistant', content: finalMessage })
      );
    } catch {
      setMessages(prev => prev.filter(m => !m.isTyping).concat({ role: 'assistant', content: "I'm having trouble processing that right now. Please try again." }));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[400px] h-[600px] glass-morphism rounded-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 fade-in">
      <div className="p-4 border-b flex items-center justify-between bg-primary rounded-t-2xl text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-bold">TGNE AI Assistant</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-md transition-colors">
          <X size={18} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-accent text-white" : "bg-muted text-primary"
              )}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={cn(
                "p-3 rounded-2xl text-sm shadow-sm",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-white text-foreground rounded-tl-none border"
              )}>
                {msg.isTyping ? (
                  <div className="flex gap-1 py-1">
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t bg-white/50">
        <div className="flex gap-2 mb-2">
          {['Unpaid invoices', 'Domains expiring', 'Add task'].map((hint) => (
            <button 
              key={hint} 
              onClick={() => setInput(hint === 'Add task' ? 'Add task for Kofi' : `Show clients with ${hint.toLowerCase()}`)}
              className="text-[10px] px-2 py-1 bg-muted hover:bg-muted-foreground/10 rounded-full border border-border transition-colors text-muted-foreground"
            >
              {hint}
            </button>
          ))}
        </div>
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative"
        >
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask TGNE anything..."
            className="pr-10 bg-white"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}