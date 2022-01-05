import React, { Component } from "react";
// @ts-ignore
import styles from "./ErrorBoundary.module.css";

export default class ErrorBoundary extends Component<{ resetErrorBoundary: () => void, width: number, children: JSX.Element }> {
  state = {
    error: null as Error | null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { resetErrorBoundary } = this.props;
    const { error } = this.state;

    if (error !== null) {
      return (
        <div style={{ width: this.props.width }}>
          <div className={styles.ErrorHeader}>Something went wrong: {error.message}</div>
          <pre className={styles.ErrorMessage}>{error.stack}</pre>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}
