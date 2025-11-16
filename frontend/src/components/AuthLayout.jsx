import React from "react";
import "../auth.css";

export default function AuthLayout({
  title,
  subtitle,
  children,
  switchText,
  switchAction,
  switchLabel,
}) {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="brand-title">Same Destination Rides</h2>
        {subtitle && <p className="brand-sub">{subtitle}</p>}

        <h3 className="form-title">{title}</h3>

        {children}

        <p className="switch-text">
          {switchText}{" "}
          <button className="switch-link" onClick={switchAction}>
            {switchLabel}
          </button>
        </p>
      </div>
    </div>
  );
}
