/**
 * Concatenate class names, filtering out falsy values.
 * Lightweight alternative to clsx.
 */
export const cn = (...classes) => classes.filter(Boolean).join(' ')

/**
 * Format file size in human-readable form.
 */
export const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format ISO date string into a readable local datetime.
 */
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
