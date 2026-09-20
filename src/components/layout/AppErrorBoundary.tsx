import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unknown application error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('GZW Tools render error', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-crash" role="alert">
        <div className="app-crash__panel">
          <span className="app-crash__code">ERR / RENDER_FAILURE</span>
          <h1>Tool view failed to render</h1>
          <p>The rest of GZW Tools is still available. Try the view again or return to the overview.</p>
          <div className="app-crash__actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={this.handleReset}>Try again</button>
            <a className="btn btn-outline btn-sm" href="/">Back to overview</a>
          </div>
          <details><summary>Technical details</summary><code>{this.state.message}</code></details>
        </div>
      </main>
    );
  }
}
