import { forwardRef } from 'react';
import type { InputProps } from '../../types';
import './Input.css';

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  maxLength,
}, ref) => {
  const inputId = `input-${name}`;
  const errorId = `error-${name}`;
  
  const baseClass = 'input-group';
  const classes = [
    baseClass,
    error && 'input-group--error',
    disabled && 'input-group--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && (
        <label htmlFor={inputId} className="input__label">
          {label}
          {required && <span className="input__required" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="input__wrapper">
        <input
          ref={ref}
          id={inputId}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="input__field"
        />
        
        {error && (
          <div className="input__error-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="input__error-icon-svg">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
              <path 
                d="M12 8v4m0 4h.01" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
      
      {error && (
        <div id={errorId} className="input__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
});