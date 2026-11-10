import { isBlankNumber } from "../lib/format";

export function NumberField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const invalid = isBlankNumber(value);
  return (
    <label className={invalid ? "field invalid" : "field"}>
      <span>{label}</span>
      <input
        value={value}
        inputMode="decimal"
        autoComplete="off"
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <small>{hint}</small> : null}
      {invalid ? <small className="field-error">请输入数字，无法识别时按 0 计算</small> : null}
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Segmented<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  name: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  hint?: string;
}) {
  return (
    <fieldset className="segmented-field">
      <legend>{label}</legend>
      <div className="segmented">
        {options.map((option) => (
          <label key={option} className={value === option ? "on" : ""}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {option}
          </label>
        ))}
      </div>
      {hint ? <small>{hint}</small> : null}
    </fieldset>
  );
}
