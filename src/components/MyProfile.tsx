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

export default function MyProfile({ onUpdated, onNavigateJoin }: MyProfileProps) {
  const { user, signInWithGoogle } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<FormState>({ name: '', class: '', school_year: '', city: '', caption: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
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
          name: data.name, class: data.class, school_year: data.school_year,
          city: data.city, caption: data.caption,
        })
        if (data.image_url) setImagePreview(getOptimizedImageUrl(data.image_url, 600))
      }
      setLoading(false)
    })()
  }, [user])

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!post || !user) return
    setError(null)
    setSubmitting(true)
    try {
      if (!form.name || !form.class || !form.school_year || !form.city || !form.caption)
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc.')

      let image_url = post.image_url
      if (imageFile) image_url = await uploadImage(imageFile)
      const geo = await geocodeCity(form.city)

      const { error: dbErr } = await supabase.from('posts').update({
        name: form.name, class: form.class, school_year: form.school_year,
        city: geo ? form.city.split(',')[0]?.trim() : form.city,
        country: geo?.country || post.country, caption: form.caption,
        image_url, lat: geo?.lat ?? post.lat, lng: geo?.lng ?? post.lng,
        email: user.email ?? null,
      }).eq('id', post.id)
      if (dbErr) throw dbErr

      setEditing(false)
      setImageFile(null)
      onUpdated()

      const { data: refreshed } = await supabase.from('posts').select('*').eq('id', post.id).single()
      if (refreshed) {
        setPost(refreshed as Post)
        if (refreshed.image_url) setImagePreview(getOptimizedImageUrl(refreshed.image_url, 600))
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

  const inp =
    'w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-[14px] text-text ' +
    'placeholder-text-faint focus:outline-none focus:ring-2 focus:ring-red/30 focus:border-red/50 transition-all duration-200'

  if (!user) {
    return (
      <div className="max-w-[560px] mx-auto px-5 py-16 text-center">
        <div className="bg-card rounded-2xl p-10 border border-border">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-text mb-2">Đăng nhập để xem hồ sơ</h2>
          <p className="text-text-dim text-sm mb-6">Bạn cần đăng nhập bằng Google để xem và quản lý hồ sơ.</p>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="text-text-faint animate-pulse text-sm">Đang tải...</span>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-[560px] mx-auto px-5 py-16 text-center">
        <div className="bg-card rounded-2xl p-10 border border-border">
          <div className="text-4xl mb-4">👋</div>
          <h2 className="text-xl font-bold text-text mb-2">Chưa có hồ sơ</h2>
          <p className="text-text-dim text-sm mb-6">Bạn chưa tạo hồ sơ. Hãy tham gia mạng lưới ngay!</p>
          <button
            onClick={onNavigateJoin}
            className="px-6 py-2.5 bg-red text-white rounded-full text-sm font-medium hover:bg-red-hover transition-colors cursor-pointer"
          >
            Tham gia mạng lưới
          </button>
        </div>
      </div>
    )
  }

  if (!editing) {
    const location = [post.city, post.country].filter(Boolean).join(', ')
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {imagePreview && (
            <div className="aspect-[3/2] overflow-hidden">
              <img src={imagePreview} alt={post.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <h2 className="text-xl font-bold text-text">{post.name}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.class && (
                <span className="inline-flex items-center px-2.5 py-1 text-[12px] font-medium bg-pill text-text-dim rounded-lg border border-pill-border">
                  {post.class}
                </span>
              )}
              {post.school_year && (
                <span className="inline-flex items-center px-2.5 py-1 text-[12px] font-medium bg-pill text-text-dim rounded-lg border border-pill-border">
                  {post.school_year}
                </span>
              )}
            </div>
            {location && (
              <p className="text-[14px] text-text-faint mt-3 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {location}
              </p>
            )}
            {(post.email || user.email) && (
              <p className="text-[14px] text-text-faint mt-2 flex items-center gap-1.5 min-w-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a
                  href={`mailto:${post.email || user.email}`}
                  className="text-red/90 hover:text-red truncate underline-offset-2 hover:underline"
                >
                  {post.email || user.email}
                </a>
              </p>
            )}
            {post.caption && (
              <p className="text-[15px] text-text-dim mt-4 leading-relaxed">{post.caption}</p>
            )}

            <div className="flex gap-3 mt-6 pt-5 border-t border-border">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 py-2.5 bg-pill text-text-dim text-[14px] font-medium rounded-xl border border-pill-border hover:text-text hover:border-border-hover transition-all cursor-pointer"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-950/40 text-rose-300 text-[14px] font-medium rounded-xl border border-rose-900/50 hover:bg-rose-950/60 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Đang xoá...' : 'Xoá hồ sơ'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const wordCount = form.caption.trim().split(/\s+/).filter(Boolean).length

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="bg-card rounded-2xl p-5 sm:p-6 md:p-7 border border-border">
        <div className="flex items-center justify-between mb-5 gap-3">
          <div>
            <h2 className="text-xl sm:text-[22px] font-bold text-text mb-0.5">Chỉnh sửa hồ sơ</h2>
            <p className="text-[13px] sm:text-sm text-text-faint">Cập nhật thông tin của bạn.</p>
          </div>
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2 text-[13px] text-text-faint hover:text-text border border-border rounded-xl hover:border-border-hover transition-all cursor-pointer"
          >
            Huỷ
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {user.email && (
            <div className="rounded-xl border border-border bg-input/40 px-4 py-3">
              <p className="text-[12px] font-medium text-text-dim mb-0.5">Email</p>
              <a href={`mailto:${user.email}`} className="text-[14px] text-red/90 hover:text-red break-all">
                {user.email}
              </a>
              <p className="text-[11px] text-text-faint mt-1">Từ tài khoản Google; được lưu cùng hồ sơ khi bạn nhấn Lưu.</p>
            </div>
          )}
          <div>
            <label className="block text-[13px] font-medium text-text-dim mb-1.5">
              Tên <span className="text-red">*</span>
            </label>
            <input type="text" name="name" value={form.name} onChange={onChange}
              placeholder="Nguyễn Văn A" className={inp} />
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          <div>
            <label className="block text-[13px] font-medium text-text-dim mb-1.5">
              Một lời nhắn nho nhỏ <span className="text-red">*</span>
            </label>
            <textarea name="caption" value={form.caption} onChange={onChange}
              placeholder="Dạo này bạn thế nào?" rows={4} className={`${inp} resize-y`} />
            <p className="text-right text-[11px] text-text-faint mt-1">{wordCount} / 30 từ</p>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-text-dim mb-1.5">
              Ảnh <span className="text-text-faint font-normal">(tuỳ chọn)</span>
            </label>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-border" />
                <button type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-base/80 backdrop-blur-sm rounded-full text-text-faint hover:text-text text-xs cursor-pointer">
                  ✕
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full py-3 bg-input border border-border rounded-xl text-[14px] text-text-faint hover:border-border-hover hover:text-text-dim transition-all duration-200 cursor-pointer">
                Chọn ảnh
              </button>
            )}
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-900/50 text-rose-300 px-4 py-3 rounded-xl text-[13px]">{error}</div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full sm:w-auto min-w-[180px] py-3 px-6 bg-red text-white text-[14px] font-semibold rounded-xl hover:bg-red-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  )
}
