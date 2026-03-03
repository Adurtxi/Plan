import {
  Switch as AriaSwitch,
  type SwitchProps as AriaSwitchProps,
} from 'react-aria-components';

interface RASwitchProps extends Omit<AriaSwitchProps, 'className' | 'children'> {
  label?: string;
  className?: string;
}

export const RASwitch = ({
  label,
  className = '',
  ...props
}: RASwitchProps) => {
  return (
    <AriaSwitch
      className={`group inline-flex items-center gap-2 cursor-pointer ${className}`}
      {...props}
    >
      <div className="w-9 h-5 bg-border-strong rounded-full transition-colors group-selected:bg-nature-primary relative">
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform group-selected:translate-x-4" />
      </div>
      {label && (
        <span className="text-sm font-medium text-text-primary">{label}</span>
      )}
    </AriaSwitch>
  );
};
