import { create } from 'zustand'

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

const useStore = create((set, get) => ({
  // Time
  timeSpeed: 1,          // 0.1 to 20
  isPaused: false,
  elapsedTime: 0,        // Accumulated simulation time (respects pause and speed)

  // Selection
  selectedBody: null,     // string key like "earth", "io", or null
  previousBody: null,     // for back navigation

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

  // Actions
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
  selectBody: (key) => {
    const state = get()
    set({
      selectedBody: key,
      previousBody: state.selectedBody,
    })
    // Mark as visited
    if (key && !state.visitedBodies.includes(key)) {
      const updated = [...state.visitedBodies, key]
      persistVisitedBodies(updated)
      set({ visitedBodies: updated })
    }
  },
  clearSelection: () => set({ selectedBody: null }),
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
}))

export default useStore
