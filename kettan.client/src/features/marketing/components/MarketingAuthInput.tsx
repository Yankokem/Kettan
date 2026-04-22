import type { ChangeEvent, ReactElement } from "react";

interface MarketingAuthInputProps {
  label: string;
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  suffix?: ReactElement;
  autoComplete?: string;
  maxLength?: number;
}

export function MarketingAuthInput({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  suffix,
  autoComplete,
  maxLength,
}: MarketingAuthInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2C1A0E", marginBottom: "6px" }}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon size={16} style={{ color: "#8C6B43" }} />
        </div>
        <input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className="w-full pl-10 pr-10 py-3 rounded-xl outline-none transition-all duration-200"
          style={{
            border: error ? "1.5px solid #EF4444" : "1.5px solid rgba(107,76,42,0.2)",
            backgroundColor: "#FDFAF5",
            fontSize: "14px",
            color: "#2C1A0E",
          }}
          onFocus={(event) => {
            event.target.style.borderColor = error ? "#EF4444" : "#6B4C2A";
            event.target.style.boxShadow = error ? "0 0 0 3px rgba(239,68,68,0.1)" : "0 0 0 3px rgba(107,76,42,0.08)";
          }}
          onBlur={(event) => {
            event.target.style.borderColor = error ? "#EF4444" : "rgba(107,76,42,0.2)";
            event.target.style.boxShadow = "none";
          }}
        />
        {suffix ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</div>
        ) : null}
      </div>
      {error ? <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>{error}</p> : null}
    </div>
  );
}
