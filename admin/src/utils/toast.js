/**
 * 轻量 Toast 通知工具
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer')
  if (!container) return

  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  container.appendChild(toast)

  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(20px)'
    toast.style.transition = 'all 0.25s ease'
    setTimeout(() => toast.remove(), 260)
  }, duration)
}
