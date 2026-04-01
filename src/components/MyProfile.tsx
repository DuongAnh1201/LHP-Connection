import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { uploadImage, getOptimizedImageUrl } from '../lib/cloudinary'
import { useAuth } from '../lib/AuthContext'
import type { Post } from '../types'

interface MyProfileProps {
  onUpdated: () => void
  onNavigateJoin: () => void
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
    // Silent fallback keeps manual text entry usable.
  }
  return null
}

export default function MyProfile({ onUpdated, onNavigateJoin }: MyProfileProps) {
  const { user, signInWithGoogle } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<FormState>({ name: '', class: '', school_year: '', city: '', caption: '', job_field: '', linkedin_url: '', facebook_url: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const shellClass = 'mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8'
  const inputClass =
    'h-12 w-full rounded-xl border border-border bg-input px-4 text-[14px] text-text outline-none transition-all placeholder:text-text-faint/80 focus:border-accent/50'
  const textareaClass = `${inputClass} h-auto min-h-[140px] py-3 resize-y`

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    ;(async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setPost(data as Post)
        setForm({
          name: data.name,
          class: data.class,
          school_year: data.school_year,
          city: data.city,
          caption: data.caption,
          job_field: data.job_field ?? '',
          linkedin_url: data.linkedin_url ?? '',
          facebook_url: data.facebook_url ?? '',
        })
        if (data.image_url) setImagePreview(getOptimizedImageUrl(data.image_url, 720))
      }
      setLoading(false)
    })()
  }, [user])

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

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!post || !user) return
    setError(null)
    setSubmitting(true)

    try {
      if (!form.name || !form.class || !form.school_year || !form.city || !form.caption) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc.')
      }

      let image_url = post.image_url
      if (imageFile) image_url = await uploadImage(imageFile)
      const geo = await geocodeCity(form.city)

      const { error: dbError } = await supabase
        .from('posts')
        .update({
          name: form.name,
          class: form.class,
          school_year: form.school_year,
          city: geo ? form.city.split(',')[0]?.trim() : form.city,
          country: geo?.country || post.country,
          caption: form.caption,
          job_field: form.job_field.trim() || null,
          linkedin_url: form.linkedin_url.trim() || null,
          facebook_url: form.facebook_url.trim() || null,
          image_url,
          lat: geo?.lat ?? post.lat,
          lng: geo?.lng ?? post.lng,
          email: user.email ?? null,
        })
        .eq('id', post.id)

      if (dbError) throw dbError

      setEditing(false)
      setImageFile(null)
      onUpdated()

      const { data: refreshed } = await supabase.from('posts').select('*').eq('id', post.id).single()
      if (refreshed) {
        setPost(refreshed as Post)
        if (refreshed.image_url) setImagePreview(getOptimizedImageUrl(refreshed.image_url, 720))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!post) return
    if (!confirm('Bạn có chắc muốn xoá hồ sơ của mình?')) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id)
      if (error) throw error
      setPost(null)
      setEditing(false)
      onUpdated()
    } catch {
      alert('Xoá thất bại. Vui lòng thử lại.')
    } finally {
      setDeleting(false)
    }
  }

  if (!user) {
    return (
      <section className={shellClass}>
        <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-border bg-panel">
          <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="rounded-[24px] border border-accent/20 bg-[radial-gradient(circle_at_top,_rgba(226,174,82,0.18),_transparent_42%),linear-gradient(180deg,_rgba(20,25,39,0.96),_rgba(13,17,27,1))] p-6 text-center">
              <p className="text-[11px] uppercase tracking-[0.28em] text-accent-strong/85">Hồ sơ của tôi</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Quản lý hồ sơ alumni bằng tài khoản của bạn.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-dim">
                Đăng nhập để xem bài viết đã gửi, chỉnh sửa thông tin, hoặc xoá hồ sơ khỏi danh sách nếu cần.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-[24px] border border-border bg-base-raised p-6 text-center sm:p-7">
              <h3 className="text-[24px] font-semibold tracking-tight text-white">Đăng nhập để xem hồ sơ</h3>
              <p className="mt-3 text-sm leading-6 text-text-dim">
                Bạn cần đăng nhập bằng đúng tài khoản Google đã dùng khi gửi bài viết để truy cập phần quản lý hồ sơ.
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

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1240px] items-center justify-center px-4 py-32 sm:px-6 lg:px-8">
        <span className="text-sm text-text-faint animate-pulse">Đang tải hồ sơ...</span>
      </div>
    )
  }

  if (!post) {
    return (
      <section className={shellClass}>
        <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-border bg-panel">
          <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="rounded-[24px] border border-accent/20 bg-[radial-gradient(circle_at_top,_rgba(226,174,82,0.18),_transparent_42%),linear-gradient(180deg,_rgba(20,25,39,0.96),_rgba(13,17,27,1))] p-6 text-center">
              <p className="text-[11px] uppercase tracking-[0.28em] text-accent-strong/85">Hồ sơ của tôi</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Bạn chưa có bài viết nào.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-dim">
                Tạo một bài viết mới để tên, ảnh và địa điểm của bạn xuất hiện trong mạng lưới alumni cùng mọi người.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-[24px] border border-border bg-base-raised p-6 text-center sm:p-7">
              <h3 className="text-[24px] font-semibold tracking-tight text-white">Bắt đầu từ trang tham gia</h3>
              <p className="mt-3 text-sm leading-6 text-text-dim">
                Bạn sẽ nhập cùng bộ dữ liệu hiện có: tên, lớp, niên khoá, địa điểm, lời nhắn, ảnh và các liên kết mạng xã hội.
              </p>
              <button
                type="button"
                onClick={onNavigateJoin}
                className="mt-6 rounded-xl border border-brand bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
              >
                Tham gia mạng lưới
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const location = [post.city, post.country].filter(Boolean).join(', ')
  const wordCount = form.caption.trim().split(/\s+/).filter(Boolean).length

  if (!editing) {
    return (
      <section className={shellClass}>
        <div className="mx-auto mb-6 max-w-[760px] text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent-strong/85">Hồ sơ của tôi</p>
          <h2 className="mt-4 text-[30px] font-semibold tracking-tight text-white sm:text-[34px]">
            Quản lý bài viết của riêng bạn trong mạng lưới alumni.
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-dim">
            Chỉnh sửa khi bạn chuyển thành phố, đổi ảnh, hoặc đơn giản chỉ muốn cập nhật một lời nhắn mới cho cộng đồng.
          </p>
        </div>

        <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-border bg-panel">
          <div className="grid gap-0 md:grid-cols-[320px,1fr]">
            <div className="border-b border-border md:border-b-0 md:border-r">
              <div className="aspect-[0.95/1] h-full overflow-hidden bg-panel-muted">
                {imagePreview ? (
                  <img src={imagePreview} alt={post.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-text-faint">
                    Chưa có ảnh
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-text-faint">Bài viết hiện tại</p>
                  <h3 className="mt-3 text-[28px] font-semibold tracking-tight text-white">{post.name}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {post.class && (
                    <span className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-strong">
                      {post.class}
                    </span>
                  )}
                  {post.school_year && (
                    <span className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-strong">
                      {post.school_year}
                    </span>
                  )}
                </div>
              </div>

              {post.job_field && <p className="mt-3 text-sm font-medium text-text-dim">{post.job_field}</p>}
              {location && <p className="mt-2 text-sm text-text-faint">{location}</p>}

              {(post.email || user.email) && (
                <a
                  href={`mailto:${post.email || user.email}`}
                  className="mt-3 inline-flex text-sm text-accent-strong transition-colors hover:text-white"
                >
                  {post.email || user.email}
                </a>
              )}

              {post.caption && (
                <p className="mt-6 max-w-2xl text-[15px] leading-7 text-text-dim">
                  {post.caption}
                </p>
              )}

              {(post.linkedin_url || post.facebook_url) && (
                <div className="mt-4 flex items-center gap-3">
                  {post.linkedin_url && (
                    <a
                      href={post.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-base-raised text-text-soft transition-all hover:border-border-strong hover:text-white"
                      aria-label="LinkedIn"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                  {post.facebook_url && (
                    <a
                      href={post.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-base-raised text-text-soft transition-all hover:border-border-strong hover:text-white"
                      aria-label="Facebook"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-xl border border-brand bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
                >
                  Chỉnh sửa hồ sơ
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-xl border border-rose-900/40 bg-rose-950/25 px-5 py-3 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? 'Đang xoá...' : 'Xoá hồ sơ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={shellClass}>
      <div className="mx-auto mb-6 max-w-[760px] text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent-strong/85">Hồ sơ của tôi</p>
        <h2 className="mt-4 text-[30px] font-semibold tracking-tight text-white sm:text-[34px]">
          Chỉnh sửa thông tin nhưng vẫn giữ nguyên cấu trúc dữ liệu hiện có.
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-dim">
          Mọi thay đổi vẫn cập nhật trực tiếp vào Supabase, chỉ có phần trình bày được làm lại để khớp với giao diện directory mới.
        </p>
      </div>

      <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-border bg-panel">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-[24px] border border-accent/20 bg-[radial-gradient(circle_at_top,_rgba(226,174,82,0.18),_transparent_42%),linear-gradient(180deg,_rgba(20,25,39,0.96),_rgba(13,17,27,1))] p-5 text-center sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent-strong/85">Thông tin đang dùng</p>
            <h3 className="mt-4 text-[26px] font-semibold tracking-tight text-white">{post.name}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-dim">
              Cập nhật ảnh, địa điểm hoặc lời nhắn mới. Dữ liệu email vẫn lấy từ tài khoản Google hiện tại của bạn khi nhấn lưu.
            </p>

            {user.email && (
              <div className="mt-8 rounded-[20px] border border-border/70 bg-base-raised p-4 text-left">
                <p className="text-[11px] uppercase tracking-[0.22em] text-text-faint">Email</p>
                <a href={`mailto:${user.email}`} className="mt-2 inline-flex text-sm font-medium text-accent-strong hover:text-white">
                  {user.email}
                </a>
                <p className="mt-2 text-[12px] leading-5 text-text-faint">
                  Email này sẽ được lưu vào bài viết khi bạn nhấn lưu thay đổi.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="rounded-[24px] border border-border bg-base-raised p-5 sm:p-6">
            <div className="grid gap-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-text-faint">Chỉnh sửa</p>
                  <h3 className="mt-2 text-[24px] font-semibold tracking-tight text-white">Cập nhật hồ sơ</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm text-text-soft transition-colors hover:border-border-strong hover:text-text"
                >
                  Huỷ
                </button>
              </div>

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
                  <input type="url" name="linkedin_url" value={form.linkedin_url} onChange={onChange} placeholder="https://linkedin.com/in/..." className={inputClass} autoComplete="url" />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.18em] text-text-faint">
                    Facebook
                  </label>
                  <input type="url" name="facebook_url" value={form.facebook_url} onChange={onChange} placeholder="https://facebook.com/..." className={inputClass} autoComplete="url" />
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
                  rows={4}
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
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
