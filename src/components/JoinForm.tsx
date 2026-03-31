import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/cloudinary'
import { useAuth } from '../lib/AuthContext'

interface JoinFormProps {
  onSubmitted: () => void
  onNavigateProfile?: () => void
}

interface FormState {
  name: string
  class: string
  school_year: string
  city: string
  caption: string
  job_field: string
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
  } catch {
    // Silent fallback keeps submit flow responsive.
  }
  return null
}

export default function JoinForm({ onSubmitted, onNavigateProfile }: JoinFormProps) {
  const { user, signInWithGoogle } = useAuth()
  const [hasExistingPost, setHasExistingPost] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('posts')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setHasExistingPost(true)
      })
  }, [user])

  const [form, setForm] = useState<FormState>({
    name: '',
    class: '',
    school_year: '',
    city: '',
    caption: '',
    job_field: '',
    linkedin_url: '',
    facebook_url: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const wordCount = form.caption.trim().split(/\s+/).filter(Boolean).length

  const inputClass =
    'h-12 w-full rounded-xl border border-border bg-input px-4 text-[14px] text-text outline-none transition-all placeholder:text-text-faint/80 focus:border-accent/50'
  const textareaClass = `${inputClass} h-auto min-h-[140px] py-3 resize-y`
  const sectionClass = 'mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8'

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((value) => ({ ...value, [event.target.name]: event.target.value }))

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const emptyToNull = (value: string) => {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (!user) throw new Error('Vui lòng đăng nhập trước khi gửi.')
      if (!form.name || !form.class || !form.school_year || !form.city || !form.caption) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc.')
      }

      let image_url: string | null = null
      if (imageFile) image_url = await uploadImage(imageFile)
      const geo = await geocodeCity(form.city)

      const { error: dbError } = await supabase.from('posts').insert({
        name: form.name,
        class: form.class,
        school_year: form.school_year,
        city: geo ? form.city.split(',')[0]?.trim() : form.city,
        country: geo?.country || '',
        caption: form.caption,
        image_url,
        job_field: emptyToNull(form.job_field),
        linkedin_url: emptyToNull(form.linkedin_url),
        facebook_url: emptyToNull(form.facebook_url),
        lat: geo?.lat || null,
        lng: geo?.lng || null,
        user_id: user.id,
        is_active: true,
        email: user.email ?? null,
      })
      if (dbError) throw dbError

      setSuccess(true)
      setForm({
        name: '',
        class: '',
        school_year: '',
        city: '',
        caption: '',
        job_field: '',
        linkedin_url: '',
        facebook_url: '',
      })
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

  if (success) {
    return (
      <section className={sectionClass}>
        <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-border bg-panel">
          <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="flex min-h-[260px] flex-col items-center justify-between rounded-[24px] border border-accent/20 bg-[radial-gradient(circle_at_top,_rgba(226,174,82,0.2),_transparent_45%),linear-gradient(180deg,_rgba(20,25,39,0.96),_rgba(13,17,27,1))] p-6 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-accent-strong/85">Tham gia mạng lưới</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Cảm ơn bạn đã cập nhật.</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-dim">
                  Thông tin của bạn đã được ghi nhận và sẽ xuất hiện trong mạng lưới ngay khi dữ liệu tải lại.
                </p>
              </div>
              <p className="text-sm text-text-faint">Giữ liên kết alumni sống động bằng một cập nhật ngắn nhưng chân thật.</p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-[24px] border border-border bg-base-raised px-6 py-8 text-center">
              <div className="mb-4 text-5xl">🎉</div>
              <h3 className="text-[24px] font-semibold tracking-tight text-white">Đã gửi thành công</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-text-dim">
                Bạn có thể tiếp tục gửi thêm một cập nhật khác hoặc quay lại danh sách để xem bài viết của mình xuất hiện cùng cộng đồng.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="mt-6 rounded-xl border border-brand bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
              >
                Gửi thêm
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className={sectionClass}>
        <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-border bg-panel">
          <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="flex min-h-[280px] flex-col items-center justify-between rounded-[24px] border border-accent/20 bg-[radial-gradient(circle_at_top,_rgba(226,174,82,0.18),_transparent_42%),linear-gradient(180deg,_rgba(20,25,39,0.96),_rgba(13,17,27,1))] p-6 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-accent-strong/85">Tham gia mạng lưới</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Cập nhật hành trình của bạn.</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-dim">
                  Điền một vài thông tin ngắn gọn, thêm ảnh nếu muốn, và để cộng đồng LHP biết bạn đang ở đâu.
                </p>
              </div>
              <p className="text-sm leading-6 text-text-faint">
                Ảnh, lời nhắn, lớp, niên khoá và địa điểm hiện tại đều sẽ giữ lại đúng dữ liệu từ hệ thống hiện có.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-[24px] border border-border bg-base-raised p-6 text-center sm:p-7">
              <p className="text-[11px] uppercase tracking-[0.28em] text-text-faint">Bảo mật</p>
              <h3 className="mt-4 text-[24px] font-semibold tracking-tight text-white">Đăng nhập để tiếp tục</h3>
              <p className="mt-3 text-sm leading-6 text-text-dim">
                Bạn cần đăng nhập bằng Google để gửi bài viết, liên kết bài viết với tài khoản của mình và quản lý hồ sơ sau này.
              </p>
              <button
                type="button"
                onClick={signInWithGoogle}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Đăng nhập bằng Google
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (hasExistingPost) {
    return (
      <section className={sectionClass}>
        <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-border bg-panel">
          <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="flex min-h-[260px] flex-col items-center justify-between rounded-[24px] border border-accent/20 bg-[radial-gradient(circle_at_top,_rgba(226,174,82,0.2),_transparent_45%),linear-gradient(180deg,_rgba(20,25,39,0.96),_rgba(13,17,27,1))] p-6 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-accent-strong/85">Mạng lưới alumni</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Bạn đã có hồ sơ.</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-dim">
                  Mỗi tài khoản chỉ có thể tạo một hồ sơ trong mạng lưới. Bạn có thể chỉnh sửa thông tin hiện có trong trang hồ sơ của mình.
                </p>
              </div>
              <p className="text-sm text-text-faint">Giữ hồ sơ cập nhật để cộng đồng luôn biết bạn đang ở đâu.</p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-[24px] border border-border bg-base-raised px-6 py-8 text-center">
              <div className="mb-4 text-5xl">👤</div>
              <h3 className="text-[24px] font-semibold tracking-tight text-white">Hồ sơ đã tồn tại</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-text-dim">
                Tài khoản của bạn đã được liên kết với một hồ sơ alumni. Hãy vào trang hồ sơ để cập nhật thông tin.
              </p>
              {onNavigateProfile && (
                <button
                  type="button"
                  onClick={onNavigateProfile}
                  className="mt-6 rounded-xl border border-brand bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
                >
                  Xem hồ sơ của tôi
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={sectionClass}>
      <div className="mx-auto mb-6 max-w-[760px] text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent-strong/85">Tham gia mạng lưới</p>
        <h2 className="mt-4 text-[30px] font-semibold tracking-tight text-white sm:text-[34px]">
          Cập nhật tình hình để cả cộng đồng nhìn thấy bạn trên bản đồ.
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-dim">
          Giữ nguyên dữ liệu hiện tại, nhưng đặt nó vào cùng ngôn ngữ hình ảnh với trang danh sách: tối, gọn, và tập trung vào ảnh cùng thông tin cốt lõi.
        </p>
      </div>

      <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-border bg-panel">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-[24px] border border-accent/20 bg-[radial-gradient(circle_at_top,_rgba(226,174,82,0.18),_transparent_42%),linear-gradient(180deg,_rgba(20,25,39,0.96),_rgba(13,17,27,1))] p-5 text-center sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent-strong/85">Hồ sơ mới</p>
            <h3 className="mt-4 text-[26px] font-semibold tracking-tight text-white">Kể một điều ngắn mà thật.</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-dim">
              Một ảnh rõ, một lời nhắn ngắn, lớp, niên khoá và thành phố hiện tại là đủ để bài viết của bạn nổi bật trên lưới alumni.
            </p>

            <div className="mt-8 rounded-[20px] border border-border/70 bg-base-raised p-4 text-left">
              <p className="text-[11px] uppercase tracking-[0.22em] text-text-faint">Tài khoản đang dùng</p>
              <p className="mt-2 truncate text-sm font-medium text-white">{user.email || 'Google account'}</p>
              <p className="mt-2 text-[12px] leading-5 text-text-faint">
                Email từ Google sẽ được lưu cùng bài viết để bạn có thể chỉnh sửa hoặc xoá nội dung về sau.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="rounded-[24px] border border-border bg-base-raised p-5 sm:p-6">
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-text-faint">
                  Tên *
                </label>
                <input type="text" name="name" value={form.name} onChange={onChange} placeholder="Nguyễn Văn A" className={inputClass} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-text-faint">
                    Lớp *
                  </label>
                  <input type="text" name="class" value={form.class} onChange={onChange} placeholder="CA1, CTR-N, CSU-Đ..." className={inputClass} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-text-faint">
                    Niên khoá *
                  </label>
                  <input type="text" name="school_year" value={form.school_year} onChange={onChange} placeholder="2020-2023" className={inputClass} />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-text-faint">
                  Địa điểm hiện tại *
                </label>
                <input type="text" name="city" value={form.city} onChange={onChange} placeholder="Nhập tên thành phố..." className={inputClass} />
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-text-faint">
                  Lĩnh vực công việc
                </label>
                <input type="text" name="job_field" value={form.job_field} onChange={onChange} placeholder="Kỹ sư phần mềm, Bác sĩ, Sinh viên..." className={inputClass} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-text-faint">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={form.linkedin_url}
                    onChange={onChange}
                    placeholder="https://linkedin.com/in/..."
                    className={inputClass}
                    autoComplete="url"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-text-faint">
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="facebook_url"
                    value={form.facebook_url}
                    onChange={onChange}
                    placeholder="https://facebook.com/..."
                    className={inputClass}
                    autoComplete="url"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-text-faint">
                  Một lời nhắn nho nhỏ *
                </label>
                <textarea
                  name="caption"
                  value={form.caption}
                  onChange={onChange}
                  placeholder="Dạo này bạn thế nào?"
                  rows={5}
                  className={textareaClass}
                />
                <p className="mt-2 text-right text-[11px] text-text-faint">{wordCount} / 30 từ</p>
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-text-faint">
                  Ảnh
                </label>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

                {imagePreview ? (
                  <div className="relative overflow-hidden rounded-[20px] border border-border">
                    <img src={imagePreview} alt="Preview" className="h-60 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                        if (fileRef.current) fileRef.current.value = ''
                      }}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-base/80 text-text transition-colors hover:bg-base-raised"
                      aria-label="Xoá ảnh"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex h-14 w-full items-center justify-center rounded-[20px] border border-dashed border-border bg-input text-sm text-text-soft transition-all hover:border-accent/40 hover:text-text"
                  >
                    Chọn ảnh
                  </button>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-[13px] text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Gửi cập nhật'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
