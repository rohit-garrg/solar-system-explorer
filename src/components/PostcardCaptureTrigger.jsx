import { useFrame, useThree } from '@react-three/fiber'
import useStore from '../stores/useStore'

/**
 * PostcardCaptureTrigger -- lives inside the Canvas.
 * Watches the capturePostcard flag; when true, grabs the canvas as a data URL.
 *
 * Must be inside <Canvas> to access useThree() for the renderer.
 * preserveDrawingBuffer must be true on the Canvas for toDataURL() to work.
 * Returns null (no visual output).
 */
export default function PostcardCaptureTrigger() {
  const { gl } = useThree()

  useFrame(() => {
    const { capturePostcard } = useStore.getState()
    if (!capturePostcard) return

    try {
      const dataUrl = gl.domElement.toDataURL('image/png')
      useStore.getState().setPostcardDataUrl(dataUrl)
    } catch (err) {
      console.warn('Postcard capture failed:', err)
      // Reset the flag so it doesn't keep trying
      useStore.setState({ capturePostcard: false })
    }
  })

  return null
}
