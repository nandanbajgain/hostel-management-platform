import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Camera,
  CircleCheck,
  GraduationCap,
  ShieldCheck,
  Trophy,
  UserRound,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/services/api'
import sauLogo from '@/assets/sau-logo.png'
import { getErrorMessage } from '@/lib/errors'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const sportsOptions = [
  'Football',
  'Cricket',
  'Badminton',
  'Basketball',
  'Table Tennis',
  'Volleyball',
  'Athletics',
  'Chess',
]

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid phone number (10-15 digits)'),
  enrollmentNo: z.string().min(4, 'Enrollment number is required'),
  course: z.string().min(2, 'Course is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  sportsInterests: z.array(z.string()).min(1, 'Select at least one sport'),
  careerGoal: z.string().min(10, 'Please add a career goal'),
  address: z.string().min(10, 'Address is required').max(250, 'Max 250 characters'),
  parentContactNo: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid parent contact (10-15 digits)'),
  avatarUrl: z.string().min(1, 'Student image is required'),
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

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--accent-secondary)',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontWeight: 700,
  marginBottom: 14,
}

export default function RegisterPage() {
  const isMobile = useMediaQuery('(max-width: 900px)')
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { sportsInterests: [] },
  })

  const sports = watch('sportsInterests') || []
  const avatarUrl = watch('avatarUrl')

  const submit = async (values: FormData) => {
    try {
      await api.post('/auth/register', values)
      toast.success(
        'Registration submitted. Wait for admin or warden approval before signing in.'
      )
      navigate('/login')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Registration failed'))
    }
  }

  const uploadAvatar = async (file?: File | null) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, or WEBP images are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setValue('avatarUrl', res.data.url, { shouldValidate: true })
      toast.success('Student photo uploaded')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Image upload failed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(108,99,255,0.16), transparent 30%), radial-gradient(circle at bottom right, rgba(34,211,238,0.12), transparent 25%), var(--bg-primary)',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(280px, 0.9fr) minmax(0, 1.35fr)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <aside
          className="card-glass"
          style={{
            padding: '2rem',
            position: 'sticky',
            top: 24,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(160deg, rgba(108,99,255,0.16), rgba(34,211,238,0.04) 48%, transparent 75%)',
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
                  Hostel Registration
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
              Create your student hostel profile with academic, contact, and lifestyle
              details so the warden can review eligibility and suggest compatible
              roommates for two-student occupancy rooms.
            </p>

            <div style={{ display: 'grid', gap: 12, marginBottom: 22 }}>
              {[
                {
                  icon: ShieldCheck,
                  title: 'Approval-based access',
                  text: 'Your account remains inactive until an admin or warden approves it.',
                },
                {
                  icon: GraduationCap,
                  title: 'Academic matching',
                  text: 'Course, career goals, and sports interests help staff pair compatible roommates.',
                },
                {
                  icon: UserRound,
                  title: 'Verified student profile',
                  text: 'A photo, enrollment number, address, and parent contact are required.',
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

            <div
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(34,211,238,0.08)',
                border: '1px solid rgba(34,211,238,0.18)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--accent-secondary)',
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                <CircleCheck size={16} />
                What happens next
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>
                1. Submit your student profile.
                <br />
                2. The warden reviews and approves your account.
                <br />
                3. Room allocation and dashboard access become available after approval.
              </div>
            </div>
          </div>
        </aside>

        <section className="card-glass" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: 24 }}>
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
              <Trophy size={14} />
              Student onboarding form
            </div>
            <h2 style={{ margin: '16px 0 8px', fontFamily: 'Sora', fontSize: 28 }}>
              Complete your hostel profile
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Fill in all required details carefully. The information below is used for
              approval, room allocation, and roommate compatibility suggestions.
            </p>
          </div>

          <form onSubmit={handleSubmit(submit)} style={{ display: 'grid', gap: 24 }}>
            <div>
              <div style={sectionTitleStyle}>Basic Information</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 14,
                }}
              >
                {[
                  ['name', 'Full name', 'Arjun Mehta'],
                  ['email', 'University email', 'student@sau.ac.in'],
                  ['password', 'Password', 'Create a password'],
                  ['phone', 'Phone number', '+91-9876543210'],
                  ['enrollmentNo', 'Enrollment number', 'SAU-2026-014'],
                  ['course', 'Course / programme', 'M.Tech Computer Science'],
                ].map(([name, label, placeholder]) => (
                  <div key={name}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        marginBottom: 6,
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </label>
                    <input
                      {...register(name as keyof FormData)}
                      type={name === 'password' ? 'password' : 'text'}
                      placeholder={placeholder}
                      style={inputStyle(Boolean(errors[name as keyof FormData]))}
                    />
                    {errors[name as keyof FormData] ? (
                      <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                        {errors[name as keyof FormData]?.message as string}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={sectionTitleStyle}>Identity and Contact</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)',
                  gap: 16,
                }}
              >
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        marginBottom: 6,
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                      }}
                    >
                      Gender
                    </label>
                    <select {...register('gender')} style={inputStyle(Boolean(errors.gender))}>
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <style>{`
                      select option {
                        color: #0f172a;
                        background: #ffffff;
                      }
                    `}</style>
                    {errors.gender ? (
                      <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                        {errors.gender.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        marginBottom: 6,
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                      }}
                    >
                      Parent contact number
                    </label>
                    <input
                      {...register('parentContactNo')}
                      placeholder="+91-9811111111"
                      style={inputStyle(Boolean(errors.parentContactNo))}
                    />
                    {errors.parentContactNo ? (
                      <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                        {errors.parentContactNo.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    border: `1px solid ${errors.avatarUrl ? 'var(--accent-danger)' : 'var(--border-default)'}`,
                    background: 'rgba(17,24,39,0.62)',
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: 'rgba(108,99,255,0.14)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Camera size={16} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>Student photograph</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                        Required for verification
                      </div>
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => uploadAvatar(event.target.files?.[0])}
                    style={{ ...inputStyle(Boolean(errors.avatarUrl)), padding: '10px 12px' }}
                  />
                  <div
                    style={{
                      marginTop: 8,
                      color: uploading ? 'var(--accent-secondary)' : 'var(--text-tertiary)',
                      fontSize: 12,
                    }}
                  >
                    {uploading
                      ? 'Uploading image...'
                      : 'Upload a clear front-facing student photo'}
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      minHeight: 160,
                      borderRadius: 14,
                      border: '1px dashed var(--border-default)',
                      background: 'rgba(255,255,255,0.02)',
                      display: 'grid',
                      placeItems: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Student preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                        <Camera size={24} style={{ margin: '0 auto 8px' }} />
                        Preview appears here
                      </div>
                    )}
                  </div>

                  {errors.avatarUrl ? (
                    <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 8 }}>
                      {errors.avatarUrl.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <div style={sectionTitleStyle}>Compatibility Profile</div>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      marginBottom: 8,
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                    }}
                  >
                    Sports interests
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {sportsOptions.map((sport) => {
                      const checked = sports.includes(sport)
                      return (
                        <label
                          key={sport}
                          style={{
                            padding: '9px 13px',
                            borderRadius: 999,
                            cursor: 'pointer',
                            background: checked
                              ? 'rgba(108,99,255,0.18)'
                              : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${
                              checked ? 'var(--accent-primary)' : 'var(--border-default)'
                            }`,
                            color: checked
                              ? 'var(--text-primary)'
                              : 'var(--text-secondary)',
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setValue(
                                'sportsInterests',
                                checked
                                  ? sports.filter((item) => item !== sport)
                                  : [...sports, sport],
                                { shouldValidate: true }
                              )
                            }
                            style={{ display: 'none' }}
                          />
                          {sport}
                        </label>
                      )
                    })}
                  </div>
                  {errors.sportsInterests ? (
                    <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                      {errors.sportsInterests.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      marginBottom: 6,
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                    }}
                  >
                    Career goal
                  </label>
                  <input
                    {...register('careerGoal')}
                    placeholder="Example: Build a career in AI research and data systems"
                    style={inputStyle(Boolean(errors.careerGoal))}
                  />
                  {errors.careerGoal ? (
                    <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                      {errors.careerGoal.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <div style={sectionTitleStyle}>Address</div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    marginBottom: 6,
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  Current address
                </label>
                <textarea
                  {...register('address')}
                  rows={4}
                  placeholder="Flat / street / city / state / PIN code"
                  style={{
                    ...inputStyle(Boolean(errors.address)),
                    resize: 'vertical',
                    minHeight: 120,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                />
                {errors.address ? (
                  <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                    {errors.address.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                paddingTop: 8,
                borderTop: '1px solid var(--border-default)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                  Sign in
                </Link>
              </div>

              <button
                className="btn-primary"
                type="submit"
                disabled={isSubmitting || uploading}
                style={{
                  minWidth: 220,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '13px 18px',
                }}
              >
                {isSubmitting ? 'Submitting registration...' : 'Submit for approval'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
