import { Component } from 'react'

/**
 * TextureErrorBoundary -- catches texture load failures so the component
 * falls back to its solid color without crashing the app.
 *
 * Props:
 *   name     {string} -- label for the console warning (e.g. "earth", "saturn-ring")
 *   fallback {ReactNode} -- what to render when the texture fails to load
 */
export default class TextureErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.warn(`Texture load failed for ${this.props.name || 'unknown'}:`, error.message)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
