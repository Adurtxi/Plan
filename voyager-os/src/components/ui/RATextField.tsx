import {
  TextField as AriaTextField,
  Label as AriaLabel,
  Input as AriaInput,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';

interface RATextFieldProps extends Omit<AriaTextFieldProps, 'className'> {
  label?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  /** For react-hook-form Controller: pass ref */
  inputRef?: React.Ref<HTMLInputElement>;
}

export const RATextField = ({
  label,
  placeholder,
  className = '',
  inputClassName = '',
  labelClassName = '',
  inputRef,
  ...props
}: RATextFieldProps) => {
  const baseLabelCls = 'block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5';
  const baseInputCls =
    'w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-primary rounded-xl p-3 text-sm outline-none transition-all text-text-primary placeholder-text-muted font-medium';

  return (
    <AriaTextField className={className} aria-label={!label ? props['aria-label'] : undefined} {...props}>
      {label && <AriaLabel className={`${baseLabelCls} ${labelClassName}`}>{label}</AriaLabel>}
      <AriaInput
        ref={inputRef}
        placeholder={placeholder}
        className={`${baseInputCls} ${inputClassName}`}
      />
    </AriaTextField>
  );
};
