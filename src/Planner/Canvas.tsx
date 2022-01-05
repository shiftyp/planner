import React, { useLayoutEffect, useRef, useState, useContext, useMemo, useEffect } from "react";
import Tooltip from "./Tooltip";

import {
  TOOLTIP_OFFSET,
} from "../config";
import { useMagicClass } from '../magic/useMagicClass';
import { ImagePreloader } from '../hooks/ImagePreloader';
import { CanvasRenderer } from '../hooks/CanvasRenderer';

type TooltipState = {
  label?: string | null;
  left: number | null;
  right: number | null;
  top: number | null;
  text?: string;
};

const DEFAULT_TOOLTIP_STATE = {
  label: null,
  left: null,
  right: null,
  top: null,
} as TooltipState;
// Processes data; arguably should be moved into Preloader component.
export default function Canvas({
  width,
}: {
  width: number;
}) {
  const preloader = useMagicClass(ImagePreloader)
  const renderer = useMagicClass(() => new CanvasRenderer(preloader, width))

  renderer.width = width

  const [tooltipState, setTooltipState] = useState<TooltipState>(
    DEFAULT_TOOLTIP_STATE
  );

  const handleMouseMove = (
    event: React.SyntheticEvent<HTMLElement, MouseEvent>
  ) => {
    const { offsetX, offsetY } = event.nativeEvent;

    for (let [text, rect] of renderer.textDOMRects) {
      if (
        offsetX >= rect.x &&
        offsetX <= rect.x + rect.width &&
        offsetY >= rect.y &&
        offsetY <= rect.y + rect.height
      ) {
        if (offsetX <= width / 2) {
          setTooltipState({
            left: offsetX + TOOLTIP_OFFSET,
            right: null,
            text,
            top: offsetY + TOOLTIP_OFFSET,
          });
        } else {
          setTooltipState({
            left: null,
            right: width - offsetX + TOOLTIP_OFFSET,
            text,
            top: offsetY + TOOLTIP_OFFSET,
          });
        }
        return;
      }
    }

    setTooltipState(DEFAULT_TOOLTIP_STATE);
  };

  return (
    <>
      <canvas
        ref={renderer.setCanvas}
        height={renderer.height}
        onMouseMove={handleMouseMove}
        width={renderer.width}
      />
      <Tooltip {...tooltipState} />
    </>
  );
}