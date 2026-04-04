import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import sauLogo from '@/assets/sau-logo.png'
import { getErrorMessage } from '@/lib/errors'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
})

type FormData = z.infer<typeof schema>

const inputStyle = (hasError = false): React.CSSProperties => ({
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${hasError ? 'var(--accent-danger)' : 'var(--border-default)'}`,
  borderRadius: 10,
  padding: '12px 14px',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
})

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Invalid credentials')
      setError('password', { message: msg })
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(108,99,255,0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(34,211,238,0.14), transparent 24%), var(--bg-primary)',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 0.92fr) minmax(0, 1.08fr)',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        <aside
          className="card-glass"
          style={{
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(155deg, rgba(108,99,255,0.16), rgba(34,211,238,0.04) 52%, transparent 75%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.96)',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={sauLogo}
                  alt="South Asian University logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--accent-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    fontWeight: 700,
                  }}
                >
                  South Asian University
                </div>
                <h1 style={{ margin: '4px 0 0', fontFamily: 'Sora', fontSize: 28 }}>
                  Hostel Portal
                </h1>
              </div>
            </div>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 15,
                lineHeight: 1.75,
                marginBottom: 22,
              }}
            >
              Access student services, room allocation details, maintenance workflows,
              announcements, and complaint tracking from a single secure dashboard.
            </p>

            <div style={{ display: 'grid', gap: 12, marginBottom: 22 }}>
              {[
                {
                  icon: ShieldCheck,
                  title: 'Role-based access',
                  text: 'Separate views for students, wardens, and administrators.',
                },
                {
                  icon: UserRoundCheck,
                  title: 'Approval-first onboarding',
                  text: 'New student registrations stay pending until staff approval.',
                },
                {
                  icon: Sparkles,
                  title: 'Operations in one place',
                  text: 'Rooms, complaints, notifications, and announcements stay connected.',
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 14,
                    background: 'rgba(17,24,39,0.62)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: 'rgba(108,99,255,0.14)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color="var(--accent-primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 3 }}>{title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                      {text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </aside>

        <section
          className="card-glass"
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ maxWidth: 520 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                background: 'rgba(108,99,255,0.12)',
                border: '1px solid rgba(108,99,255,0.2)',
                color: 'var(--accent-primary)',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.1,
              }}
            >
              <ArrowRight size={14} />
              Secure sign in
            </div>

            <h2 style={{ margin: '16px 0 8px', fontFamily: 'Sora', fontSize: 30 }}>
              Welcome back
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Sign in with your approved account to continue to the hostel management
              platform.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 18, marginTop: 28 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 6,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Email address
                </label>
                <input
                  {...register('email')}
                  placeholder="you@sau.ac.in"
                  style={inputStyle(Boolean(errors.email))}
                />
                {errors.email ? (
                  <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 6,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    style={{ ...inputStyle(Boolean(errors.password)), paddingRight: 46 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((state) => !state)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password ? (
                  <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: 15,
                  marginTop: 8,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Signing in...' : 'Sign in to dashboard'}
              </button>
            </form>

            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: '1px solid var(--border-default)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              <span>Need an account?</span>
              <Link to="/register" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                Register as a student
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
