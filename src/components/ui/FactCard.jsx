import { useState, useEffect, useCallback } from 'react'
import useStore from '../../stores/useStore'
import useAudio from '../../hooks/useAudio'
import factsData from '../../data/facts.json'

/**
 * Fact card overlay — slides in from right (desktop) or up from bottom (mobile).
 * Shows body name, fun fact, stats, and navigation.
 *
 * Uses inline styles for the slide animation because Tailwind v3 can't
 * handle dynamic transform values in template literals.
 */
export default function FactCard() {
  const selectedBody = useStore((s) => s.selectedBody)
  const clearSelection = useStore((s) => s.clearSelection)
  const incrementFactsViewed = useStore((s) => s.incrementFactsViewed)

  const { playSfx } = useAudio()
  const [factIndex, setFactIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  // When selection changes, reset fact index and animate in
  useEffect(() => {
    if (selectedBody) {
      setFactIndex(Math.floor(Math.random() * (factsData[selectedBody]?.facts?.length || 1)))
      // Small delay so the CSS transition can play
      const timer = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [selectedBody])

  const handleNextFact = useCallback(() => {
    if (!selectedBody || !factsData[selectedBody]) return
    const facts = factsData[selectedBody].facts
    setFactIndex((prev) => (prev + 1) % facts.length)
    incrementFactsViewed()
    playSfx('click')
  }, [selectedBody, incrementFactsViewed, playSfx])

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    // Wait for slide-out animation then clear selection
    setTimeout(() => clearSelection(), 300)
  }, [clearSelection])

  // Don't render anything if no body is selected and animation is done
  if (!selectedBody && !isVisible) return null

  const body = factsData[selectedBody]
  if (!body) return null

  const currentFact = body.facts[factIndex] || body.facts[0]

  return (
    <>
      {/* Desktop: slide from right. Mobile: slide from bottom. */}
      {/* Desktop panel (hidden on mobile) */}
      <div
        className="hidden md:flex fixed top-0 right-0 h-full w-96 z-50 flex-col pointer-events-auto"
        style={{
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        <div className="m-4 mt-16 rounded-2xl bg-black/70 backdrop-blur-sm text-white p-6 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-5rem)]">
          <CardContent
            body={body}
            currentFact={currentFact}
            onNext={handleNextFact}
            onDismiss={handleDismiss}
          />
        </div>
      </div>

      {/* Mobile bottom sheet (hidden on desktop) */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-auto"
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out',
        }}
      >
        <div className="mx-2 mb-2 rounded-t-2xl bg-black/70 backdrop-blur-sm text-white p-5 max-h-[50vh] overflow-y-auto">
          <CardContent
            body={body}
            currentFact={currentFact}
            onNext={handleNextFact}
            onDismiss={handleDismiss}
          />
        </div>
      </div>
    </>
  )
}

/**
 * Inner content shared between desktop and mobile layouts.
 */
function CardContent({ body, currentFact, onNext, onDismiss }) {
  return (
    <>
      {/* Header with name and dismiss */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{body.name}</h2>
        <button
          onClick={onDismiss}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-xl"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Fun fact */}
      <div className="bg-white/10 rounded-xl p-4">
        <p className="text-base leading-relaxed">{currentFact}</p>
      </div>

      {/* Next fact button */}
      <button
        onClick={onNext}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-base font-medium transition-colors"
      >
        Next Fact
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries(body.stats).map(([key, value]) => (
          <div key={key} className="bg-white/5 rounded-lg p-2">
            <div className="text-white/50 text-xs capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="text-white/90">{value}</div>
          </div>
        ))}
      </div>
    </>
  )
}
