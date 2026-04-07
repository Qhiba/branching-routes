// ============================================================
// SelectField.jsx — Dropdown selector field
// ============================================================
// A controlled select dropdown for the inspector panel.
// Renders options from a provided array, with optional
// null/"none" placeholder. Fires onChange immediately.
//
// Architecture rules enforced:
//   AR-01: PascalCase.jsx under src/components/inspector/fields/
//   AR-09: all visual styling deferred to InspectorPanel.css
// ============================================================

import { useCallback } from 'react';

/**
 * Dropdown selector field.
 *
 * @param {object} props
 * @param {string} props.label — Field label text
 * @param {string|null} props.value — Current selected value (null shows placeholder)
 * @param {(value: string|null) => void} props.onChange — Called on change; value is null for "none"
 * @param {Array<{value: string, label: string}>} props.options — Available options
 * @param {boolean} [props.nullable=true] — Whether to show a "None" option
 * @param {string} [props.placeholder="— None —"] — Placeholder label for null value
 * @param {boolean} [props.disabled=false] — Disable the select
 * @param {string} [props.id] — HTML id
 */
function SelectField({
  label,
  value,
  onChange,
  options = [],
  nullable = true,
  placeholder = '— None —',
  disabled = false,
  id,
}) {
  const handleChange = useCallback(
    (e) => {
      const selected = e.target.value;
      onChange(selected === '__null__' ? null : selected);
    },
    [onChange]
  );

  const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-') ?? 'select'}`;

  return (
    <div className="inspector-field">
      <label className="inspector-field__label" htmlFor={inputId}>
        {label}
      </label>
      <select
        id={inputId}
        className="inspector-field__select"
        value={value ?? '__null__'}
        onChange={handleChange}
        disabled={disabled}
      >
        {nullable && (
          <option value="__null__">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectField;
