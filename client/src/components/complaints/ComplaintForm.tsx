import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '@/services/api'
import ImageUploadZone from './ImageUploadZone'
import { copyToClipboard } from '@/lib/clipboard'
import { getErrorMessage } from '@/lib/errors'

const schema = z.object({
  category: z.string().min(1, 'Select a category'),
  title: z.string().min(5, 'Minimum 5 characters'),
  description: z.string().min(20, 'Please describe the issue in at least 20 characters'),
})

type FormValues = z.infer<typeof schema>

const categories = [
  'PLUMBING',
  'ELECTRICAL',
  'CLEANING',
  'FURNITURE',
  'SECURITY',
  'FOOD',
  'INTERNET',
  'OTHER',
]

export default function ComplaintForm({
  onSuccess,
  anonymous = false,
}: {
  onSuccess?: (payload: { token: string }) => void
  anonymous?: boolean
}) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submittedToken, setSubmittedToken] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const submit = async (values: FormValues) => {
    setLoading(true)
    try {
      let imageUrl: string | undefined

      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        const uploadRes = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrl = uploadRes.data.url
      }

      const endpoint = anonymous ? '/complaints/anonymous' : '/complaints'
      const res = await api.post(endpoint, { ...values, imageUrl })
      toast.success(anonymous ? 'Anonymous complaint submitted' : 'Complaint submitted')

      const token = typeof res.data?.token === 'string' ? res.data.token : ''
      if (token) setSubmittedToken(token)
      onSuccess?.({ token })
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Submission failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} style={{ display: 'grid', gap: 16 }}>
      {submittedToken ? (
        <div
          style={{
            padding: '0.9rem 1rem',
            borderRadius: 12,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, color: 'var(--accent-success)' }}>Token</div>
            <div style={{ marginTop: 4, fontFamily: 'JetBrains Mono', fontSize: 13 }}>
              {submittedToken}
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              const ok = await copyToClipboard(submittedToken)
              toast.success(ok ? 'Copied token' : 'Could not copy token')
            }}
          >
            Copy token
          </button>
        </div>
      ) : null}
      <div>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'var(--text-secondary)' }}>
          Category
        </label>
        <select
          {...register('category')}
          style={{
            width: '100%',
            background: 'var(--bg-tertiary)',
            border: `1px solid ${errors.category ? 'var(--accent-danger)' : 'var(--border-default)'}`,
            borderRadius: 8,
            padding: '10px 14px',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
        {errors.category ? <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 4 }}>{errors.category.message}</p> : null}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'var(--text-secondary)' }}>
          Title
        </label>
        <input
          {...register('title')}
          placeholder="Issue summary"
          style={{
            width: '100%',
            background: 'var(--bg-tertiary)',
            border: `1px solid ${errors.title ? 'var(--accent-danger)' : 'var(--border-default)'}`,
            borderRadius: 8,
            padding: '10px 14px',
            color: 'var(--text-primary)',
          }}
        />
        {errors.title ? <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 4 }}>{errors.title.message}</p> : null}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'var(--text-secondary)' }}>
          Description
        </label>
        <textarea
          {...register('description')}
          rows={5}
          placeholder="Describe the issue in detail"
          style={{
            width: '100%',
            background: 'var(--bg-tertiary)',
            border: `1px solid ${errors.description ? 'var(--accent-danger)' : 'var(--border-default)'}`,
            borderRadius: 8,
            padding: '10px 14px',
            color: 'var(--text-primary)',
            resize: 'vertical',
            fontFamily: 'DM Sans, sans-serif',
          }}
        />
        {errors.description ? (
          <p style={{ color: 'var(--accent-danger)', fontSize: 12, marginTop: 4 }}>
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color: 'var(--text-secondary)' }}>
          Supporting Image
        </label>
        <ImageUploadZone
          imagePreview={imagePreview}
          onDrop={(file) => {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
          }}
          onClear={() => {
            setImageFile(null)
            setImagePreview(null)
          }}
        />
      </div>

      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? 'Submitting...' : anonymous ? 'Submit Anonymously' : 'Submit Complaint'}
      </button>
    </form>
  )
}
