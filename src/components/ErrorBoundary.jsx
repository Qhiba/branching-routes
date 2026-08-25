import React from 'react';
import { useNarrativeStore } from 'store';
import { safeClear } from '../utils/safeStorage';

/**
 * ErrorBoundary (RISK-AUD-02 Fix)
 * Catches unhandled React rendering and lifecycle errors in child components.
 * Prevents blank white screens and provides emergency backup export & storage reset actions.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Unhandled React Rendering Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleEmergencyExport = () => {
    try {
      const data = useNarrativeStore.getState().exportGraph();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `emergency_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Could not export emergency backup: ${err.message}`);
    }
  };

  handleResetStorage = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear stored project data and start fresh? This action cannot be undone unless you exported a backup.'
      )
    ) {
      try {
        if (window.indexedDB) {
          window.indexedDB.deleteDatabase('BranchingRoutesDB');
        }
        safeClear();
      } catch (err) {
        console.error('Failed to clear storage:', err);
      } finally {
        window.location.reload();
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-overlay">
          <div className="error-boundary-card">
            <div className="error-boundary-header">
              <span className="error-boundary-icon">⚠️</span>
              <h2>Something went wrong</h2>
            </div>
            <p className="error-boundary-description">
              An unexpected runtime error occurred while rendering the application.
            </p>

            {this.state.error && (
              <details className="error-boundary-details">
                <summary>View Diagnostic Info</summary>
                <div className="error-boundary-stack">
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <br />
                      <br />
                      <strong>Component Stack:</strong>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-boundary-actions">
              <button
                className="btn btn--primary"
                onClick={this.handleReload}
                type="button"
              >
                Reload App
              </button>
              <button
                className="btn btn--secondary"
                onClick={this.handleEmergencyExport}
                type="button"
              >
                Export Backup JSON
              </button>
              <button
                className="btn btn--danger"
                onClick={this.handleResetStorage}
                type="button"
              >
                Reset & Clear Storage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
