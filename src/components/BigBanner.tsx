import type { Toast } from '../context/ToastProvider'

/** Vollbild-Einblendung für Erfolge („passed“) und Pech („wasted“). Eigene Texte, keine Original-Assets. */
export default function BigBanner({ banner, onClose }: { banner: Toast; onClose: () => void }) {
  const wasted = banner.variant === 'wasted'
  return (
    <div
      className={`banner-wrap fixed inset-0 z-50 grid place-items-center ${wasted ? 'wasted-overlay' : ''}`}
      style={{ ['--out' as string]: wasted ? '2.9s' : '2.5s' }}
      onClick={onClose}
      onAnimationEnd={(e) => e.animationName === 'banner-out' && onClose()}
      role="status"
      aria-live="assertive"
    >
      {wasted ? (
        <div className="px-4 text-center">
          <p className="font-display wasted-text text-7xl text-[#e8152f] [text-shadow:0_4px_0_#000,0_0_24px_#ff2e88] sm:text-9xl">
            {banner.title}
          </p>
          {banner.text && <p className="banner-sub mt-4 text-lg font-semibold text-white">{banner.text}</p>}
        </div>
      ) : (
        <div className="banner-band w-full bg-gradient-to-r from-transparent via-night/90 to-transparent py-6 text-center">
          <div className="mx-auto mb-3 h-[2px] w-2/3 bg-gradient-to-r from-transparent via-sun to-transparent" />
          <p className="font-display banner-text sunset-text text-5xl sm:text-7xl">{banner.title}</p>
          {banner.text && <p className="banner-sub mt-2 px-4 text-base font-semibold text-white/90">{banner.text}</p>}
          <div className="mx-auto mt-3 h-[2px] w-2/3 bg-gradient-to-r from-transparent via-pink to-transparent" />
        </div>
      )}
    </div>
  )
}
