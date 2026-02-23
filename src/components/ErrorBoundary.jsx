import { Component } from 'react'

/**
 * Catches Three.js and React crashes, shows a friendly fallback
 * instead of a blank screen.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Solar System Explorer crashed:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white text-center p-8">
          <p className="text-2xl mb-4">Oops! The universe had a hiccup.</p>
          <button
            onClick={this.handleReload}
            className="px-6 py-3 bg-blue-600 rounded-lg text-lg hover:bg-blue-500 transition-colors"
          >
            Tap to reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
