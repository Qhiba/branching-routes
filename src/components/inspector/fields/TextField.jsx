// ============================================================
// TextField.jsx — Editable text input field
// ============================================================
// A controlled text input for the inspector panel.
// Supports single-line input and multiline textarea modes.
// All edits fire onChange immediately — no local buffering.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/inspector/fields/
//   AR-09: all visual styling deferred to InspectorPanel.css
// ============================================================

import { useCallback } from 'react';

/**
 * Editable text input field.
 *
 * @param {object} props
 * @param {string} props.label — Field label text
 * @param {string} props.value — Current value
 * @param {(value: string) => void} props.onChange — Called on every change
 * @param {string} [props.placeholder] — Placeholder text
 * @param {boolean} [props.multiline=false] — Use textarea instead of input
 * @param {boolean} [props.disabled=false] — Disable editing
 * @param {boolean} [props.monospace=false] — Use monospace font
 * @param {string} [props.id] — HTML id for the input element
 */
function TextField({
  label,
  value,
  onChange,
  placeholder = '',
  multiline = false,
  disabled = false,
  monospace = false,
  id,
}) {
  const handleChange = useCallback(
    (e) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-') ?? 'text'}`;
  const className = [
    'inspector-field__input',
    monospace && 'inspector-field__input--mono',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="inspector-field">
      <label className="inspector-field__label" htmlFor={inputId}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={inputId}
          className={`${className} inspector-field__textarea`}
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
        />
      ) : (
        <input
          id={inputId}
          type="text"
          className={className}
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export default TextField;
