import { useCallback, useRef } from 'react'
import useStore from '../../stores/useStore'
import factsData from '../../data/facts.json'

// Frame padding and styling constants for the composite postcard
const FRAME_PADDING = 32
const FRAME_COLOR = '#1a1a2e'
const BORDER_COLOR = '#d4a042'
const BORDER_WIDTH = 4
const TEXT_HEIGHT = 56

/**
 * PostcardCapture -- camera icon button + full-screen preview overlay.
 *
 * Button: triggers a canvas screenshot via store flag.
 * Overlay: shows the captured image with a decorative gold border and
 * text ("Greetings from {planet}!"), plus Save and Cancel buttons.
 *
 * Download uses an offscreen <canvas> to composite the image + frame + text
 * into a single PNG that the user downloads.
 */
export default function PostcardCapture() {
  const postcardDataUrl = useStore((s) => s.postcardDataUrl)
  const requestPostcardCapture = useStore((s) => s.requestPostcardCapture)
  const clearPostcard = useStore((s) => s.clearPostcard)
  const selectedBody = useStore((s) => s.selectedBody)

  const canvasRef = useRef(null)

  // Build the greeting text
  const bodyName = selectedBody
    ? (factsData[selectedBody]?.name || selectedBody)
    : null
  const greeting = bodyName
    ? `Greetings from ${bodyName}!`
    : 'Exploring the Solar System!'

  const handleCapture = useCallback(() => {
    requestPostcardCapture()
  }, [requestPostcardCapture])

  const handleCancel = useCallback(() => {
    clearPostcard()
  }, [clearPostcard])

  const handleSave = useCallback(() => {
    if (!postcardDataUrl) return

    const img = new Image()
    img.onload = () => {
      // Create offscreen canvas for compositing
      const w = img.width + FRAME_PADDING * 2
      const h = img.height + FRAME_PADDING * 2 + TEXT_HEIGHT
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')

      // Background
      ctx.fillStyle = FRAME_COLOR
      ctx.fillRect(0, 0, w, h)

      // Gold border around image area
      ctx.strokeStyle = BORDER_COLOR
      ctx.lineWidth = BORDER_WIDTH
      ctx.strokeRect(
        FRAME_PADDING - BORDER_WIDTH / 2,
        FRAME_PADDING - BORDER_WIDTH / 2,
        img.width + BORDER_WIDTH,
        img.height + BORDER_WIDTH,
      )

      // Draw the captured image
      ctx.drawImage(img, FRAME_PADDING, FRAME_PADDING)

      // Text at bottom
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(greeting, w / 2, img.height + FRAME_PADDING + TEXT_HEIGHT / 2)

      // Small watermark
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText('Solar System Explorer', w / 2, h - 10)

      // Trigger download
      const link = document.createElement('a')
      link.download = `space-postcard-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = postcardDataUrl
  }, [postcardDataUrl, greeting])

  return (
    <>
      {/* Camera button -- fixed position, top-right area below VolumeControl */}
      <button
        onClick={handleCapture}
        className="fixed top-16 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
        style={{ minWidth: 48, minHeight: 48 }}
        aria-label="Take a space postcard screenshot"
        title="Postcard from Space"
      >
        {/* Camera icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      {/* Preview overlay -- shown when a screenshot has been captured */}
      {postcardDataUrl && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 max-w-[90vw] max-h-[90vh]">
            {/* Framed image preview */}
            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                border: `4px solid ${BORDER_COLOR}`,
                background: FRAME_COLOR,
                padding: '8px 8px 0 8px',
              }}
            >
              <img
                ref={canvasRef}
                src={postcardDataUrl}
                alt="Space postcard preview"
                className="block max-w-[80vw] max-h-[60vh] object-contain rounded"
              />
              {/* Greeting text below image */}
              <p
                className="text-center py-3 font-bold text-lg"
                style={{ color: '#ffffff', fontFamily: 'system-ui, sans-serif' }}
              >
                {greeting}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-base font-medium transition-colors"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                Save Postcard
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-base font-medium transition-colors"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
