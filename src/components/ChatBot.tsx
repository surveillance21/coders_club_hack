"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
        { role: 'bot', content: 'Hello! I am the Civic AI Assistant. How can I help you regarding city pipelines, grievance filing, or local administration today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const isLogin = pathname === '/login';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    if (isLogin) return null; // Don't show chatbot on login page

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history: messages })
            });
            const data = await res.json();

            if (res.ok && data.reply) {
                setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I am having trouble connecting to my neural network right now.' }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', content: 'An error occurred while fetching the response.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'Inter, sans-serif' }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'absolute',
                            bottom: '80px',
                            right: 0,
                            width: '350px',
                            height: '500px',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: '16px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            border: '1px solid var(--border-light)',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Chat Header */}
                        <div style={{ padding: '16px', background: 'var(--primary-accent)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Bot size={20} />
                                <span style={{ fontWeight: 600 }}>CivicAI Assistant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ color: 'white', opacity: 0.8, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)' }}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <div style={{
                                        maxWidth: '80%',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        lineHeight: 1.5,
                                        backgroundColor: msg.role === 'user' ? 'var(--primary-accent)' : 'var(--bg-primary)',
                                        color: msg.role === 'user' ? 'white' : 'var(--fg-primary)',
                                        border: msg.role === 'user' ? 'none' : '1px solid var(--border-light)',
                                        borderBottomRightRadius: msg.role === 'user' ? '0px' : '12px',
                                        borderBottomLeftRadius: msg.role === 'bot' ? '0px' : '12px',
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderBottomLeftRadius: '0px' }}>
                                        <Loader2 size={16} className="animate-spin text-muted" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div style={{ padding: '16px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-light)' }}>
                            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        borderRadius: '999px',
                                        border: '1px solid var(--border-light)',
                                        background: 'var(--bg-secondary)',
                                        fontSize: '14px',
                                        outline: 'none',
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        background: input.trim() && !isLoading ? 'var(--primary-accent)' : '#ccc',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: 'none',
                                        cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <Send size={18} style={{ marginLeft: '2px' }} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-accent)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(26, 137, 23, 0.3)',
                    border: 'none',
                    cursor: 'pointer',
                    zIndex: 10000
                }}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </motion.button>
        </div>
    );
}
