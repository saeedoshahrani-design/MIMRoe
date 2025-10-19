import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Added a constructor to properly initialize the component's state. This resolves multiple errors related to `this.state`, `this.props`, and `this.setState` being unavailable.
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    };
  }

  static getDerivedStateFromError(_: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in React component:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const errorDetails = this.state.error ? `Message: ${this.state.error.message}\n\nStack Trace:\n${this.state.error.stack}` : 'No error details available.';
      const componentStack = this.state.errorInfo ? `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}` : '';
      
      const escapeHtml = (unsafe: string) => {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
      }

      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#fff8f8', color: '#4a5567', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'left' }}>
            <h1 style={{ color: '#c53030', fontSize: '1.5rem', marginBottom: '1rem' }}>An Error Occurred</h1>
            <p>Something went wrong while rendering the application. Please try refreshing the page.</p>
            <details style={{ marginTop: '1.5rem', width: '100%', maxWidth: '800px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
                <pre style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '0.25rem', overflow: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {escapeHtml(errorDetails + componentStack)}
                </pre>
            </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
