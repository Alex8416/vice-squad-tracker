import type { Toast } from '../context/ToastProvider'

const styles: Record<Toast['variant'], { title: string; box: string }> = {
  passed: { title: 'sunset-text', box: 'border-sun/60' },
  wasted: { title: 'text-[#ff3b3b] [text-shadow:0_0_14px_#ff2e88]', box: 'border-pink/60' },
  info: { title: 'neon-teal', box: 'border-teal/50' },
  error: { title: 'neon-pink', box: 'border-pink/70' },
}

export default function NeonToast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const s = styles[toast.variant]
  return (
    <button
      type="button"
      onClick={onClose}
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={`toast-in pointer-events-auto w-full max-w-md rounded-xl border-y-2 bg-night/85 px-5 py-3 text-center backdrop-blur-md ${s.box}`}
    >
      <p className={`font-display title-skew text-3xl sm:text-4xl ${s.title}`}>{toast.title}</p>
      {toast.text && <p className="mt-1 text-sm text-white/85">{toast.text}</p>}
    </button>
  )
}
