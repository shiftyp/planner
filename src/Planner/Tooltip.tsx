import React from 'react'
// @ts-ignore
import styles from "./Tooltip.module.css";

export default function Tooltip({
  left,
  right,
  text,
  top,
}: {
  left: number | null;
  right: number | null;
  text?: string | null;
  top: number | null;
  label?: string | null
}) {
  if (!text) {
    return null;
  }

  return (
    <div
      className={styles.Tooltip}
      style={{
        left: left != null ? `${left}px` : "",
        right: right != null ? `${right}px` : "",
        top: top != null ? `${top}px` : "",
      }}
    >
      {text}
    </div>
  );
}
