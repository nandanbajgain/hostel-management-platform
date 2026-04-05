import { Bot, Send } from 'lucide-react'
import type { ChatMessage } from '@/types'

export default function ChatWindow({
  messages,
  loading,
  input,
  setInput,
  onSend,
}: {
  messages: ChatMessage[]
  loading: boolean
  input: string
  setInput: (value: string) => void
  onSend: (value: string) => void
}) {
  return (
    <>
      <div
        style={{
          height: 320,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, paddingTop: 20 }}>
            <Bot size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            Hi. Ask about rooms, hostel rules, complaints, or facilities.
          </div>
        ) : null}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius:
                  msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {msg.content}
              {msg.role === 'assistant' && msg.sources && msg.sources.length ? (
                <div style={{ marginTop: 8, fontSize: 11, opacity: 0.75 }}>
                  Sources:{' '}
                  {msg.sources
                    .slice(0, 3)
                    .map((s) => s.title || s.type || 'KB')
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {loading ? (
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              borderRadius: '12px 12px 12px 2px',
              width: 'fit-content',
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--text-tertiary)',
                  animation: `bounce 1s ${i * 0.2}s ease-in-out infinite`,
                  display: 'inline-block',
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border-default)',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend(input)}
          placeholder="Ask anything..."
          style={{
            flex: 1,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={() => onSend(input)}
          disabled={!input.trim() || loading}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: input.trim() ? 'var(--accent-primary)' : 'var(--bg-hover)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          <Send size={15} color="white" />
        </button>
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </>
  )
}
