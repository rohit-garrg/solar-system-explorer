import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Load persisted visited bodies from localStorage
function loadVisitedBodies() {
  try {
    const saved = localStorage.getItem('solar-explorer-visited')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Save visited bodies to localStorage
function persistVisitedBodies(bodies) {
  try {
    localStorage.setItem('solar-explorer-visited', JSON.stringify(bodies))
  } catch {
    // localStorage unavailable (e.g., private browsing) — silently fail
  }
}

const useStore = create(subscribeWithSelector((set, get) => ({
  // Time
  timeSpeed: 1,          // 0.1 to 20
  isPaused: false,
  elapsedTime: 0,        // Accumulated simulation time (respects pause and speed)

  // Selection
  selectedBody: null,     // string key like "earth", "io", or null
  previousBody: null,     // for back navigation
  wasPausedBeforeSelect: false, // remembers pause state so deselect can restore it

  // Camera reset (used by BackButton when no body is selected)
  requestingReset: false,

  // Modes
  spacecraftMode: false,
  sizeComparisonMode: false,
  isFlying: false,        // spacecraft in transit
  flightTarget: null,     // destination body key

  // Audio
  audioEnabled: false,    // user has opted in
  masterVolume: 0.5,      // 0 to 1

  // Discovery
  visitedBodies: loadVisitedBodies(),
  factsViewed: 0,         // count of "Next Fact" taps

  // Performance
  qualityLevel: 'high',   // 'high' | 'medium' | 'low'

  // Postcard
  postcardDataUrl: null,   // base64 PNG data URL of captured screenshot
  capturePostcard: false,  // flag: when true, PostcardCaptureTrigger grabs the canvas

  // Actions
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
  selectBody: (key) => {
    const state = get()
    // On first selection (nothing was selected before), capture pause state
    const wasPaused = state.selectedBody === null
      ? state.isPaused
      : state.wasPausedBeforeSelect
    set({
      selectedBody: key,
      previousBody: state.selectedBody,
      wasPausedBeforeSelect: wasPaused,
      isPaused: true, // Freeze orbits so the planet stays under the camera
    })
    // Mark as visited
    if (key && !state.visitedBodies.includes(key)) {
      const updated = [...state.visitedBodies, key]
      persistVisitedBodies(updated)
      set({ visitedBodies: updated })
    }
  },
  clearSelection: () => set((s) => ({
    selectedBody: null,
    isPaused: s.wasPausedBeforeSelect, // Restore original pause state
  })),
  resetView: () => set((s) => ({
    selectedBody: null,
    requestingReset: true,
    isPaused: s.selectedBody ? s.wasPausedBeforeSelect : s.isPaused,
  })),
  clearResetRequest: () => set({ requestingReset: false }),
  toggleSpacecraftMode: () => set((s) => ({ spacecraftMode: !s.spacecraftMode })),
  toggleSizeComparison: () => set((s) => ({
    sizeComparisonMode: !s.sizeComparisonMode,
    isPaused: !s.sizeComparisonMode ? true : s.isPaused,
  })),
  markVisited: (key) => {
    const state = get()
    if (state.visitedBodies.includes(key)) return
    const updated = [...state.visitedBodies, key]
    persistVisitedBodies(updated)
    set({ visitedBodies: updated })
  },
  incrementFactsViewed: () => set((s) => ({ factsViewed: s.factsViewed + 1 })),
  setQualityLevel: (level) => set({ qualityLevel: level }),
  enableAudio: () => set({ audioEnabled: true }),
  setMasterVolume: (vol) => set({ masterVolume: vol }),
  setIsFlying: (flying) => set({ isFlying: flying }),
  setFlightTarget: (target) => set({ flightTarget: target }),
  requestPostcardCapture: () => set({ capturePostcard: true }),
  setPostcardDataUrl: (url) => set({ postcardDataUrl: url, capturePostcard: false }),
  clearPostcard: () => set({ postcardDataUrl: null }),
})))

export default useStore
