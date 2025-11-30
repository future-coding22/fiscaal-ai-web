'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type Message = { role: 'user' | 'assistant'; content: string };

export function Chat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          history: messages,
          chatId 
        }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
      if (data.chatId) setChatId(data.chatId);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Er ging iets mis. Probeer opnieuw.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="space-y-4 mb-4 min-h-[200px]">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center py-8">
            Stel je eerste vraag...
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <span className={`inline-block p-3 rounded-lg max-w-[80%] ${
              m.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && (
          <div className="text-gray-400">Denken...</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Welke belastingen moet ik betalen als zzp'er?"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          →
        </button>
      </div>
      
      {!session && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Log in om je gesprekken te bewaren.
        </p>
      )}
    </div>
  );
}
