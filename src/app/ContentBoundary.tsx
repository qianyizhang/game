import { Component, type ReactNode } from 'react';
/** Lazy game imports include pack validation. Keep errors visible and leave saves intact. */
export class ContentBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: '' };
  static getDerivedStateFromError(error: unknown) {
    return { error: String(error) };
  }
  render() {
    return this.state.error ? (
      <main className="game-loading">
        <h1>Could not open this game</h1>
        <p>
          Check the content definition or module named below, then reload. Saved runs have not been
          replaced.
        </p>
        <pre role="alert" style={{ whiteSpace: 'pre-wrap' }}>
          {this.state.error}
        </pre>
        <button onClick={() => location.reload()}>Reload after fixing</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
