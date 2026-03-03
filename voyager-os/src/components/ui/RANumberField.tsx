import {
  NumberField as AriaNumberField,
  Label as AriaLabel,
  Input as AriaInput,
  type NumberFieldProps as AriaNumberFieldProps,
} from 'react-aria-components';

interface RANumberFieldProps extends Omit<AriaNumberFieldProps, 'className'> {
  label?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export const RANumberField = ({
  label,
  placeholder,
  className = '',
  inputClassName = '',
  labelClassName = '',
  ...props
}: RANumberFieldProps) => {
  const baseLabelCls = 'block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5';
  const baseInputCls =
    'w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-primary rounded-xl p-3 text-sm outline-none transition-all text-text-primary font-bold text-center';

  return (
    <AriaNumberField className={className} {...props}>
      {label && <AriaLabel className={`${baseLabelCls} ${labelClassName}`}>{label}</AriaLabel>}
      <AriaInput
        placeholder={placeholder}
        className={`${baseInputCls} ${inputClassName}`}
      />
    </AriaNumberField>
  );
};
