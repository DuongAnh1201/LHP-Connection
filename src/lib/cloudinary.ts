const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

export async function uploadImage(file: File): Promise<string> {
  if (!CLOUD_NAME) throw new Error('Cloudinary chưa được cấu hình (cloud name).')
  if (!UPLOAD_PRESET) throw new Error('Cloudinary chưa được cấu hình (upload preset). Tạo unsigned upload preset trong Cloudinary Dashboard.')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message || `Upload ảnh thất bại (${res.status})`)
  }

  const data = await res.json()
  return data.secure_url
}

export function getOptimizedImageUrl(url: string, width = 400): string {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`)
}
