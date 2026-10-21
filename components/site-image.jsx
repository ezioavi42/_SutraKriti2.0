import Image from 'next/image'

const OPTIMIZED_REMOTE_HOSTS = new Set([
  'avatars.githubusercontent.com',
  'images.unsplash.com',
  'images.pexels.com',
  'i.pravatar.cc',
])

function shouldSkipRemoteOptimization(src) {
  if (typeof src !== 'string' || !/^https?:\/\//i.test(src)) return false
  try {
    return !OPTIMIZED_REMOTE_HOSTS.has(new URL(src).hostname)
  } catch {
    return true
  }
}

export default function SiteImage({ src, ...props }) {
  if (!src) return null
  const imageSrc = typeof src === 'string' ? src.replace(/^\/products\//, '/api/media/') : src
  return <Image src={imageSrc} unoptimized={shouldSkipRemoteOptimization(imageSrc)} {...props} />
}