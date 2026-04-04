import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, MessageCircle, X } from 'lucide-react'
import api from '@/services/api'
import { useChatStore } from '@/store/chatStore'
import ChatWindow from './ChatWindow'

export default function ChatWidget() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const { messages, addMessage, isOpen, setOpen } = useChatStore()

  const quickReplies = [
    'My room info',
    'Meal timings',
    'Hostel rules',
    'How to file complaint',
  ]

  const send = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: text,
      timestamp: new Date(),
    }
    addMessage(userMsg)
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMsg]
        .slice(-6)
        .map((message) => ({ role: message.role, content: message.content }))
      const res = await api.post('/chatbot/message', { message: text, history })
      addMessage({
        id: `${Date.now()}_bot`,
        role: 'assistant',
        content: res.data.message,
        timestamp: new Date(),
      })
    } catch {
      addMessage({
        id: `${Date.now()}_err`,
        role: 'assistant',
        content:
          'Sorry, I could not process that. Please try again or contact the warden.',
        timestamp: new Date(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            style={{
              position: 'absolute',
              bottom: 68,
              right: 0,
              width: 360,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--bg-tertiary)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={16} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>HostelBot</div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--accent-success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent-success)',
                      display: 'inline-block',
                    }}
                  />
                  Online
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <ChatWindow
              messages={messages}
              loading={loading}
              input={input}
              setInput={setInput}
              onSend={send}
            />

            {messages.length < 2 ? (
              <div
                style={{
                  padding: '0 1rem 8px',
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => send(reply)}
                    style={{
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 20,
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--accent-primary)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px var(--glow-primary)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? 'x' : 'chat'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {isOpen ? <X size={22} color="white" /> : <MessageCircle size={22} color="white" />}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
