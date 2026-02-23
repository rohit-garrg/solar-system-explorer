# CHUNK 4 Implementation Plan (Steps 14-18)

## Current State
Steps 1-13 complete. Build passes (1,156 KB). All features from Chunks 1-3 working.

## Step 14: Postcard from Space

### Architecture: Split approach (no portals)
- PostcardCaptureTrigger (inside Canvas): uses useThree() to capture gl.domElement.toDataURL()
- PostcardCapture (outside Canvas): button + preview overlay + download

### Store additions (useStore.js):
- postcardDataUrl: null
- capturePostcard: false
- Actions: requestPostcardCapture, setPostcardDataUrl, clearPostcard

### PostcardCaptureTrigger.jsx (NEW, inside Canvas):
- In useFrame: check capturePostcard flag, if true call gl.domElement.toDataURL('image/png')
- Store data URL via setPostcardDataUrl
- Returns null

### PostcardCapture.jsx (replace placeholder):
- Camera icon button (fixed position, top-right area below VolumeControl)
- Preview overlay when postcardDataUrl is non-null:
  - Full-screen dark overlay
  - Captured image with decorative CSS border (gold, rounded)
  - Text: "Greetings from {bodyName}!" or "Exploring the Solar System!"
  - Save button: offscreen canvas composite (image + frame + text) -> download via <a> element
  - Cancel button: clearPostcard()

### Download with frame: Use offscreen <canvas> to composite:
- Background: #1a1a2e
- Gold border
- Image centered with padding
- Text at bottom
- Export as PNG

### Wire: SolarSystem.jsx (PostcardCaptureTrigger), App.jsx (PostcardCapture)

### Key: preserveDrawingBuffer already true on Canvas

---

## Step 15: Performance Monitor

### usePerformance.js (replace stub):
- Rolling window of 60 frame timestamps via performance.now()
- Check every 3 seconds: compute avg FPS from window
- < 20 FPS -> 'low', < 30 FPS -> 'medium', > 50 FPS -> 'high'
- Only change when crossing thresholds (debounced)

### PerformanceMonitor.jsx (replace stub):
- Calls usePerformance() hook, returns null

### Quality adaptation in existing components:
- AsteroidBelt: high=500, medium=200, low=100
- Starfield DimStars: high=1800, medium=1000, low=500; BrightStars: high=200, medium=100, low=50
- Planet segments: high=64, medium=32, low=16
- Moon segments: high=32, medium=16, low=8
- Comet tail: hidden at 'low'

### React.memo: Wrap Planet, Moon, OrbitLine exports

### Wire: PerformanceMonitor into SolarSystem.jsx

---

## Step 16: Responsive Layout and Touch Polish

### Layout positions:
- top-left: BackButton
- top-center: SizeComparison
- top-right: SoundEnableButton/VolumeControl
- top-right below: PostcardCapture button
- right-center: ModeToggle
- bottom-center: TimeSlider
- bottom-left: DiscoveryTracker
- right/bottom: FactCard

### Fixes needed:
- VolumeControl mute button: increase to 44x44px (w-11 h-11)
- Range slider thumb: increase to 24px in index.css
- DiscoveryTracker: move up on mobile (bottom-16 md:bottom-4) to avoid TimeSlider overlap
- All buttons: verify min 44x44px touch targets
- All interactive elements: add/verify aria-labels
- FactCard: verify font sizes (14px+ for stats, 24px for name)
- PostcardCapture button: position at top-16 right-4

---

## Step 17: Final Polish

### 1. Planet name labels
- Html from drei, positioned above planet (y = radius + 0.8)
- Only visible when: camera distance from origin > 80, no body selected, not in size comparison
- Style: white, 10px, opacity 0.6, pointerEvents none
- Check camera distance in useFrame every 30 frames, update state

### 2. Selected planet highlight ring
- RingGeometry (radius*1.3 to radius*1.5), 64 segments
- Blue emissive (#4488FF), pulsing opacity (0.3-0.8 via sin(time*3))
- Inside tilt group, outside spin group
- Hidden during size comparison

### 3. Loading screen
- "Solar System Explorer" title + "Loading the universe..." subtitle
- Full-screen black overlay, z-200
- Visible for 1.5s, then fades out over 1s, then removed from DOM

### 4. WebGL context loss handler
- Already has event listeners in App.jsx onCreated
- Add state variable webglLost, show overlay with reload button
- "The universe needs a moment..." friendly message
- z-300 (highest)

### 5. CSS transitions review
- Most components already have transition-colors
- Add any missing transitions

---

## Step 18: Build and Deployment

### vite.config.js:
- Add base: './' for relative asset paths
- Add CSP headers in server.headers and preview.headers

### iframe-test.html:
- Simple HTML page with iframe pointing to ./dist/index.html
- Tests: touch events, scroll containment, autoplay attribute

### README.md:
- Project description, features list, tech stack
- Setup instructions (npm install, texture download, audio)
- Development and build commands
- Iframe embedding code + CSP header
- Keyboard shortcuts
- Performance notes
- Credits

### Final build:
- npm run build, fix all errors
- Verify dist/ output with relative paths
- Optional: manual chunks for Three.js (build.rollupOptions.output.manualChunks)

---

## Files Modified Per Step
- Step 14: useStore.js, PostcardCaptureTrigger.jsx(new), PostcardCapture.jsx, SolarSystem.jsx, App.jsx
- Step 15: usePerformance.js, PerformanceMonitor.jsx, SolarSystem.jsx, AsteroidBelt.jsx, Starfield.jsx, Planet.jsx, Moon.jsx, Comet.jsx, OrbitLine.jsx
- Step 16: VolumeControl.jsx, DiscoveryTracker.jsx, index.css, PostcardCapture.jsx, various UI components
- Step 17: Planet.jsx, Sun.jsx, App.jsx
- Step 18: vite.config.js, iframe-test.html(new), README.md(new)
