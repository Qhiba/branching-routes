import React, { useState, useEffect } from 'react';

export default function DebouncedTextarea({ value, onChange, delay = 300, ...props }) {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localVal !== value && onChange) {
        onChange(localVal);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [localVal, value, delay, onChange]);

  return (
    <textarea
      {...props}
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={(e) => {
        if (localVal !== value && onChange) {
          onChange(localVal);
        }
        if (props.onBlur) props.onBlur(e);
      }}
    />
  );
}
