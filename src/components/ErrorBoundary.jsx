import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ChemSim Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1d24' }}>
          <div className="text-center p-8 rounded-xl" style={{ background: '#22262f', maxWidth: 420 }}>
            <div className="text-4xl mb-4">&#x26A0;&#xFE0F;</div>
            <h2 className="text-xl font-semibold mb-3" style={{ color: '#e8eaf0' }}>
              Something went wrong with the simulation.
            </h2>
            <p className="mb-6" style={{ color: '#8a95a8' }}>
              Please reload the page to start again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg font-medium text-white cursor-pointer"
              style={{ background: '#4f9cf0', minWidth: 160, minHeight: 44 }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
