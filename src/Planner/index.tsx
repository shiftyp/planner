import React, { useContext } from "react";
import Canvas from "./Canvas";
import ErrorBoundary from "./ErrorBoundary";

export default function Planner({
  resetError,
  width,
}: {
  resetError: () => void;
  width: number;
}) {
  return (
    <ErrorBoundary resetErrorBoundary={resetError} width={width}>
      <Canvas
        width={width}
      />
    </ErrorBoundary>
  );
}
