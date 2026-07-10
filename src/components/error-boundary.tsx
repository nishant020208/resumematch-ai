import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error) { console.error(err); }
  render() {
    if (this.state.err) {
      return (
        <div className="mx-auto max-w-md p-8 text-center">
          <h2 className="font-mono text-lg">Something broke.</h2>
          <p className="mt-2 text-sm text-muted-foreground">{this.state.err.message}</p>
          <button onClick={() => this.setState({ err: null })} className="mt-4 rounded-md bg-[color:var(--acid)] px-4 py-2 font-mono text-xs text-[color:var(--acid-foreground)]">reset</button>
        </div>
      );
    }
    return this.props.children;
  }
}