import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/cloudinary'
import { useAuth } from '../lib/AuthContext'

interface JoinFormProps {
  onSubmitted: () => void
}

interface FormState {
  name: string
  class: string
  school_year: string
  city: string
  caption: string
  linkedin_url: string
  facebook_url: string
}

async function geocodeCity(city: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=1`
    )
    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), country: data[0].address?.country || '' }
    }
  } catch { /* silent */ }
  return null
}

export default function JoinForm({ onSubmitted }: JoinFormProps) {
  const { user, signInWithGoogle } = useAuth()
  const [form, setForm] = useState<FormState>({
    name: '', class: '', school_year: '', city: '', caption: '', linkedin_url: '', facebook_url: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const wordCount = form.caption.trim().split(/\s+/).filter(Boolean).length

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const r = new FileReader()
    r.onload = () => setImagePreview(r.result as string)
    r.readAsDataURL(file)
  }

  const emptyToNull = (s: string) => {
    const t = s.trim()
    return t.length > 0 ? t : null
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (!user) throw new Error('Vui lòng đăng nhập trước khi gửi.')
      if (!form.name || !form.class || !form.school_year || !form.city || !form.caption)
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc.')

      let image_url: string | null = null
      if (imageFile) image_url = await uploadImage(imageFile)
      const geo = await geocodeCity(form.city)

      const { error: dbErr } = await supabase.from('posts').insert({
        name: form.name, class: form.class, school_year: form.school_year,
        city: geo ? form.city.split(',')[0]?.trim() : form.city,
        country: geo?.country || '', caption: form.caption, image_url,
        linkedin_url: emptyToNull(form.linkedin_url),
        facebook_url: emptyToNull(form.facebook_url),
        lat: geo?.lat || null, lng: geo?.lng || null,
        user_id: user.id, is_active: true,
        email: user.email ?? null,
      })
      if (dbErr) throw dbErr

      setSuccess(true)
      setForm({ name: '', class: '', school_year: '', city: '', caption: '', linkedin_url: '', facebook_url: '' })
      setImageFile(null)
      setImagePreview(null)
      onSubmitted()
    } catch (err) {
      console.error('JoinForm submit error:', err)
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.')
    } finally {
      setSubmitting(false)
    }
  }

  const inp =
    'w-full bg-input border border-border rounded-xl px-4 py-3 text-[15px] text-text ' +
    'placeholder-text-faint focus:outline-none focus:ring-2 focus:ring-red/30 focus:border-red/50 transition-all duration-200'

  /** Centers the form card vertically and horizontally */
  const shellCenter =
    'w-full min-h-[calc(100dvh-6.5rem)] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10'

  if (success) {
    return (
      <div className={shellCenter}>
        <div className="w-full max-w-md mx-auto bg-card rounded-2xl p-6 sm:p-8 border border-border text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-text mb-2">Cảm ơn bạn!</h2>
          <p className="text-text-dim text-sm">Thông tin của bạn đã được ghi nhận.</p>
          <button onClick={() => setSuccess(false)}
            className="mt-6 px-6 py-2.5 bg-red text-white rounded-full text-sm font-medium hover:bg-red-hover transition-colors cursor-pointer">
            Gửi thêm
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={shellCenter}>
        <div className="w-full max-w-md mx-auto bg-card rounded-2xl p-6 sm:p-8 border border-border text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-text mb-2">Đăng nhập để tiếp tục</h2>
          <p className="text-text-dim text-sm mb-6">Bạn cần đăng nhập bằng Google để tham gia mạng lưới.</p>
          <button
            onClick={signInWithGoogle}
            className="px-6 py-2.5 bg-white text-gray-800 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng nhập bằng Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={shellCenter}>
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border w-full shadow-sm shadow-black/10">
          <h2 className="text-xl sm:text-2xl font-bold text-text mb-1">Cập nhật tình hình</h2>
          <p className="text-sm text-text-faint mb-6">Hãy kể cho chúng tớ về hành trình của bạn!</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-text-dim mb-1.5">
                Tên <span className="text-red">*</span>
              </label>
              <input type="text" name="name" value={form.name} onChange={onChange}
                placeholder="Nguyễn Văn A" className={inp} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[13px] font-medium text-text-dim mb-1.5">
                  Lớp <span className="text-red">*</span>
                </label>
                <input type="text" name="class" value={form.class} onChange={onChange}
                  placeholder="CA1, CTR-N, CSU-Đ,..." className={inp} />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-text-dim mb-1.5">
                  Niên khoá <span className="text-red">*</span>
                </label>
                <input type="text" name="school_year" value={form.school_year} onChange={onChange}
                  placeholder="2020-2023" className={inp} />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-dim mb-1.5">
                Địa điểm hiện tại <span className="text-red">*</span>
              </label>
              <input type="text" name="city" value={form.city} onChange={onChange}
                placeholder="Nhập tên thành phố..." className={inp} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[13px] font-medium text-text-dim mb-1.5">
                  LinkedIn <span className="text-text-faint font-normal">(tuỳ chọn)</span>
                </label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={form.linkedin_url}
                  onChange={onChange}
                  placeholder="https://linkedin.com/in/..."
                  className={inp}
                  autoComplete="url"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-text-dim mb-1.5">
                  Facebook <span className="text-text-faint font-normal">(tuỳ chọn)</span>
                </label>
                <input
                  type="url"
                  name="facebook_url"
                  value={form.facebook_url}
                  onChange={onChange}
                  placeholder="https://facebook.com/..."
                  className={inp}
                  autoComplete="url"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-dim mb-1.5">
                Một lời nhắn nho nhỏ <span className="text-red">*</span>
              </label>
              <textarea name="caption" value={form.caption} onChange={onChange}
                placeholder="Dạo này bạn thế nào?" rows={5}
                className={`${inp} resize-y min-h-[120px]`} />
              <p className="text-right text-[11px] text-text-faint mt-1">{wordCount} / 30 từ</p>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-dim mb-1.5">
                Ảnh <span className="text-text-faint font-normal">(tuỳ chọn)</span>
              </label>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
              {imagePreview ? (
                <div className="relative w-full">
                  <img src={imagePreview} alt="Preview" className="w-full h-44 sm:h-48 object-cover rounded-xl border border-border" />
                  <button type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-base/80 backdrop-blur-sm rounded-full text-text-faint hover:text-text text-xs cursor-pointer">
                    ✕
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full py-3 bg-input border border-border rounded-xl text-sm text-text-faint hover:border-border-hover hover:text-text-dim transition-all duration-200 cursor-pointer">
                  Chọn ảnh
                </button>
              )}
            </div>

            {error && (
              <div className="bg-rose-950/40 border border-rose-900/50 text-rose-300 px-4 py-3 rounded-xl text-[13px]">{error}</div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full sm:w-auto min-w-[200px] py-3 px-8 bg-red text-white text-[15px] font-semibold rounded-xl hover:bg-red-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {submitting ? 'Đang gửi...' : 'Gửi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
