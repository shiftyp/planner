import React from 'react'
import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/palenight";
// @ts-ignore
import styles from "./CodeEditor.module.css";
import { useMagicClass } from './magic/useMagicClass';
import { FocusManager } from './hooks/FocusManager';
import { CodeData } from './types';

export default function Prism({
  data,
  label,
  testName,
}: {
  data: CodeData<any>;
  label: string;
  testName: string;
}) {
  const focusManager = useMagicClass(FocusManager)

  const handleBlur = (event: React.SyntheticEvent<HTMLTextAreaElement, FocusEvent>) => {
    focusManager.blur()
    data.update((event.target as HTMLTextAreaElement).value);
  };

  const handleFocus = (event: React.SyntheticEvent<HTMLPreElement, FocusEvent>) => {
    focusManager.focus()
  };

  const handleKeyDown = (event: React.SyntheticEvent<HTMLTextAreaElement, KeyboardEvent>) => {
    switch (event.nativeEvent.keyCode) {
      case 27: // Escape
        focusManager.blur()
        break;
      default:
        break;
    }
  };

  let content = null;
  
  if (focusManager.isFocused) {
    content = (
      <textarea
        data-testname={`CodeEditor-textarea-${testName}`}
        defaultValue={data.string}
        className={styles.TextArea}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        ref={focusManager.setTarget}
        spellCheck="false"
      />
    );
  } else {
    content = (
      <Highlight
        key={data.string}
        {...defaultProps}
        code={data.string}
        theme={theme}
        language="javascript"
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} ${styles.Pre}`}
            data-testname={`CodeEditor-pre-${testName}`}
            onFocus={handleFocus}
            style={style}
            tabIndex={0}
          >
            {tokens.map((line, i) => (
              <div {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    );
  }

  return (
    <>
      <div className={styles.Header}>
        <div className={styles.HeaderText}>{label}</div>
        {focusManager.isFocused && (
          <div className={styles.HeaderHint}>(auto-saves on blur)</div>
        )}
      </div>
      {content}
    </>
  );
}
