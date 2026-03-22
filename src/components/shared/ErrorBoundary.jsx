import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-lg shadow-sm">
            <h2 className="text-xl font-bold text-red-700 mb-3">Something went wrong</h2>
            <p className="text-sm text-red-600 mb-6">
              A rendering error occurred in this section. Your data has been auto-saved and is safe.
            </p>
            <pre className="text-xs text-red-500 bg-red-100 p-3 rounded-lg mb-6 text-left overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
