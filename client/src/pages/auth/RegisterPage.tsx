import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const coursePreferenceOptions = [
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'LAW', label: 'Law' },
  { value: 'INTERNATIONAL_RELATIONS', label: 'International Relations' },
  { value: 'SOCIOLOGY', label: 'Sociology' },
  { value: 'MATHEMATICS', label: 'Mathematics' },
]

const sportsOptions = [
  'Football',
  'Cricket',
  'Badminton',
  'Basketball',
  'Table Tennis',
  'Volleyball',
  'Athletics',
  'Chess',
  'Tennis',
  'Gym',
]

const hobbyOptions = [
  'Painting',
  'Singing',
  'Gym',
  'Reading',
  'Gaming',
  'Dancing',
  'Cooking',
  'Writing',
]

const sleepScheduleOptions = [
  { value: 'EARLY_BIRD', label: 'Early bird' },
  { value: 'BALANCED', label: 'Balanced' },
  { value: 'NIGHT_OWL', label: 'Night owl' },
]

const noiseToleranceOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
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
  coursePreference: z.string().min(1, 'Select an academic stream'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  sportsInterests: z.array(z.string()).min(1, 'Select at least one sport'),
  hobbies: z.array(z.string()).min(1, 'Select at least one hobby'),
  sleepSchedule: z.string().min(1, 'Select a sleep schedule'),
  noiseTolerance: z.string().min(1, 'Select a noise tolerance'),
  studyHours: z.coerce.number().int().min(1, 'Select study hours').max(16),
  sleepHours: z.coerce.number().int().min(3, 'Select sleep hours').max(12),
  careerGoal: z.string().min(10, 'Please add a career goal'),
  address: z.string().min(10, 'Address is required').max(250, 'Max 250 characters'),
  parentContactNo: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Enter a valid parent contact (10-15 digits)'),
  avatarUrl: z.string().min(1, 'Student image is required'),
  role: z.literal('STUDENT'),
})

type FormValues = z.input<typeof schema>
type FormData = z.output<typeof schema>

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

const multiSelectStyle = (hasError = false): React.CSSProperties => ({
  ...inputStyle(hasError),
  minHeight: 140,
})

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
  } = useForm<FormValues, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sportsInterests: [],
      hobbies: [],
      role: 'STUDENT',
      studyHours: 6,
      sleepHours: 7,
    },
  })

  const avatarUrl = watch('avatarUrl')
  const sportsInterests = watch('sportsInterests') || []
  const hobbies = watch('hobbies') || []

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

  const updateMultiSelect = (
    field: 'sportsInterests' | 'hobbies',
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value)
    setValue(field, values as FormValues[typeof field], { shouldValidate: true })
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
              data so the admin can review eligibility and approve roommate compatibility
              recommendations.
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
                  title: 'Cluster-ready data',
                  text: 'Course stream, sports, hobbies, sleep pattern, and noise tolerance feed the compatibility model.',
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
                1. Submit your registration profile.
                <br />
                2. The admin reviews clustering-based compatibility suggestions.
                <br />
                3. The admin approves the profile and allots a room.
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
              Fill in all required details carefully. These details are used for approval,
              roommate clustering, and room allocation suggestions.
            </p>
          </div>

          <form onSubmit={handleSubmit(submit)} style={{ display: 'grid', gap: 24 }}>
            <input type="hidden" {...register('avatarUrl')} />
            <input type="hidden" {...register('role')} />

            <div>
              <div style={sectionTitleStyle}>Basic Information</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
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
                  gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(260px, 320px)',
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
                      Home address
                    </label>
                    <textarea
                      {...register('address')}
                      placeholder="New Delhi, India"
                      rows={4}
                      style={inputStyle(Boolean(errors.address))}
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
                    {uploading ? 'Uploading image...' : 'Upload a clear front-facing student photo'}
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      minHeight: 180,
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                  gap: 14,
                }}
              >
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
                    Academic stream preference
                  </label>
                  <select
                    {...register('coursePreference')}
                    style={inputStyle(Boolean(errors.coursePreference))}
                  >
                    <option value="">Select stream</option>
                    {coursePreferenceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.coursePreference ? (
                    <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                      {errors.coursePreference.message}
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
                    Sleep schedule
                  </label>
                  <select
                    {...register('sleepSchedule')}
                    style={inputStyle(Boolean(errors.sleepSchedule))}
                  >
                    <option value="">Select sleep schedule</option>
                    {sleepScheduleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.sleepSchedule ? (
                    <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                      {errors.sleepSchedule.message}
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
                    Noise tolerance
                  </label>
                  <select
                    {...register('noiseTolerance')}
                    style={inputStyle(Boolean(errors.noiseTolerance))}
                  >
                    <option value="">Select noise tolerance</option>
                    {noiseToleranceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.noiseTolerance ? (
                    <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                      {errors.noiseTolerance.message}
                    </p>
                  ) : null}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
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
                      Study hours/day
                    </label>
                    <select {...register('studyHours')} style={inputStyle(Boolean(errors.studyHours))}>
                      {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                        <option key={value} value={value}>
                          {value} hour{value > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                    {errors.studyHours ? (
                      <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                        {errors.studyHours.message}
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
                      Sleep hours/day
                    </label>
                    <select {...register('sleepHours')} style={inputStyle(Boolean(errors.sleepHours))}>
                      {Array.from({ length: 8 }, (_, index) => index + 5).map((value) => (
                        <option key={value} value={value}>
                          {value} hours
                        </option>
                      ))}
                    </select>
                    {errors.sleepHours ? (
                      <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                        {errors.sleepHours.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                  gap: 14,
                  marginTop: 14,
                }}
              >
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
                    Sports interests
                  </label>
                  <select
                    multiple
                    value={sportsInterests}
                    onChange={(event) => updateMultiSelect('sportsInterests', event)}
                    style={multiSelectStyle(Boolean(errors.sportsInterests))}
                  >
                    {sportsOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 6 }}>
                    Hold Ctrl/Cmd to select multiple sports.
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
                    Hobbies
                  </label>
                  <select
                    multiple
                    value={hobbies}
                    onChange={(event) => updateMultiSelect('hobbies', event)}
                    style={multiSelectStyle(Boolean(errors.hobbies))}
                  >
                    {hobbyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 6 }}>
                    Hold Ctrl/Cmd to select multiple hobbies.
                  </div>
                  {errors.hobbies ? (
                    <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                      {errors.hobbies.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
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
                <textarea
                  {...register('careerGoal')}
                  rows={4}
                  placeholder="Describe your academic or career direction"
                  style={inputStyle(Boolean(errors.careerGoal))}
                />
                {errors.careerGoal ? (
                  <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 5 }}>
                    {errors.careerGoal.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
                Your preferences will be stored and reused for compatibility clustering after registration.
              </p>
              <button className="btn-primary" type="submit" disabled={isSubmitting || uploading}>
                {isSubmitting ? 'Submitting...' : 'Submit registration'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

