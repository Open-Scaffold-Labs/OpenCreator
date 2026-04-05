import React, { useState, useRef, useEffect, useCallback } from 'react';

// ─── Open Creator AI Beacon ───
// Context-aware AI assistant for content creation workspace

const SUGGESTIONS = [
    {
        'icon': '📝',
        'text': 'How do I plan content?',
        'category': 'planning'
    },
    {
        'icon': '📅',
        'text': 'Set up a content calendar',
        'category': 'calendar'
    },
    {
        'icon': '📊',
        'text': 'Track engagement metrics',
        'category': 'analytics'
    },
    {
        'icon': '🎯',
        'text': 'Manage brand partnerships',
        'category': 'brand'
    }
];

function getAIResponse(message) {
  const m = message.toLowerCase();
  if (m.includes('content')) return `Content planning:

**1.** Go to **Content** in the sidebar
**2.** Create posts with topic, platform, and status
**3.** Draft copy and attach media
**4.** Move through workflow: Draft → Review → Scheduled → Published

Batch create content for the week ahead.`;
  if (m.includes('calendar')) return `Content calendar:

**1.** Go to **Calendar** in the sidebar
**2.** View monthly or weekly layout
**3.** Drag content to schedule dates
**4.** Color-coded by platform and status

Never miss a posting day.`;
  if (m.includes('analytics')) return `Engagement tracking:

**1.** Go to **Analytics** in the sidebar
**2.** View reach, impressions, and engagement rate
**3.** Compare performance across platforms
**4.** Identify top-performing content

Data-driven decisions for better content.`;
  if (m.includes('brand')) return `Brand partnerships:

**1.** Go to **Partnerships** in the sidebar
**2.** Track inbound and outbound deals
**3.** Manage deliverables and deadlines
**4.** Log payments and invoices

Professional partnership management.`;
  if (m.includes('hello') || m.includes('hi') || m.includes('hey'))
    return "Hey! I'm the Open Creator assistant. I can help you navigate the app, find features, and answer questions. What can I help you with?";
  return "I can help you with content creation workspace! Try asking about specific features, or pick a suggestion to get started.";
}

function renderContent(content) {
  let html = content
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
  return <p className="text-sm leading-relaxed text-gray-600" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function Beacon() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { if (isOpen) { setTimeout(() => inputRef.current?.focus(), 100); setHasNew(false); } }, [isOpen]);

  // Keyboard: Cmd+K toggle, Esc close
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsOpen(p => !p); }
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Welcome tooltip after 5s
  useEffect(() => {
    const seen = sessionStorage.getItem('beacon_seen');
    if (!seen) {
      const t = setTimeout(() => { if (!isOpen) setShowTip(true); }, 5000);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const send = useCallback((text) => {
    if (!text.trim()) return;
    setShowTip(false);
    sessionStorage.setItem('beacon_seen', '1');
    setMessages(p => [...p, { role: 'user', content: text, time: new Date() }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(p => [...p, { role: 'assistant', content: getAIResponse(text), time: new Date() }]);
      setIsTyping(false);
      if (!isOpen) setHasNew(true);
    }, 600 + Math.random() * 800);
  }, [isOpen]);

  return (
    <>
      {/* ── Beacon Button ── */}
      <button
        onClick={() => { setIsOpen(!isOpen); setShowTip(false); sessionStorage.setItem('beacon_seen', '1'); }}
        className={`fixed bottom-6 right-6 z-50 group transition-all duration-300 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        aria-label="Open Creator AI assistant"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 opacity-30 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 opacity-40 blur-md group-hover:opacity-60 transition" />
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-200">
          <span className="text-2xl">🎬</span>
        </div>
        {hasNew && <span className="absolute top-0 right-0 w-4 h-4 bg-purple-500 rounded-full border-2 border-white animate-bounce" />}
        <span className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 transition bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[10px] text-gray-500 whitespace-nowrap pointer-events-none shadow-sm">⌘K</span>
      </button>

      {/* ── Welcome Tooltip ── */}
      {showTip && !isOpen && (
        <div className="fixed bottom-24 right-6 z-50 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xl max-w-[220px] relative">
            <button onClick={() => setShowTip(false)} className="absolute top-1 right-2 text-gray-400 hover:text-gray-600 text-xs">×</button>
            <p className="text-gray-900 text-xs font-medium mb-1">Need help?</p>
            <p className="text-gray-500 text-[10px]">Ask me anything about Open Creator.</p>
            <div className="absolute bottom-0 right-6 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-200" />
          </div>
        </div>
      )}

      {/* ── Chat Panel ── */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
        <div className="w-[380px] h-[540px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ boxShadow: `0 25px 60px -15px ${c.ring}0.25), 0 0 40px -10px ${c.ring}0.15)` }}>

          {/* Header */}
          <div className="relative px-5 py-4 flex items-center justify-between flex-shrink-0 border-b border-gray-100">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-violet-600" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-lg">
                🎬
              </div>
              <div>
                <h3 className="text-gray-900 font-bold text-sm leading-none">Open Creator AI</h3>
                <p className="text-emerald-500 text-[10px] mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[10px] border border-gray-200 rounded px-1.5 py-0.5">⌘K</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ scrollbarWidth: 'thin' }}>
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-gray-900 text-sm font-semibold mb-1">Welcome to Open Creator</p>
                  <p className="text-gray-500 text-xs leading-relaxed">Content creation workspace. Ask me anything or try a suggestion below.</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider font-medium mb-2 px-1">Suggestions</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => send(s.text)}
                        className="text-left px-3 py-2.5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 hover:border-purple-400 transition group flex items-center gap-2.5">
                        <span className="text-base flex-shrink-0">{s.icon}</span>
                        <span className="text-gray-600 text-xs group-hover:text-gray-900 transition">{s.text}</span>
                        <svg className="w-3 h-3 text-gray-300 group-hover:text-purple-400 transition ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-br-md'
                    : 'bg-gray-50 border border-gray-100 text-gray-600 rounded-bl-md'
                }`}>
                  {msg.role === 'assistant' ? renderContent(msg.content) : <p className="text-sm">{msg.content}</p>}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map(d => <span key={d} className={`w-2 h-2 bg-purple-500 rounded-full animate-bounce`} style={{ animationDelay: d + 'ms' }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick pills */}
          {messages.length > 0 && messages.length < 6 && (
            <div className="px-4 py-2 border-t border-gray-100 flex-shrink-0">
              <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {SUGGESTIONS.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => send(s.text)}
                    className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-purple-400 transition whitespace-nowrap">
                    {s.icon} {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2">
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                placeholder="Ask Creator anything..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition" />
              <button type="submit" disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center text-white disabled:opacity-30 hover:opacity-90 transition flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
              </button>
            </form>
            <p className="text-center text-[9px] text-gray-400 mt-2">Open Creator AI · Powered by Open Scaffold</p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </>
  );
}
