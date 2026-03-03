import {
  Select as AriaSelect,
  Label as AriaLabel,
  Button as AriaButton,
  SelectValue as AriaSelectValue,
  Popover as AriaPopover,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  type Key,
} from 'react-aria-components';
import { ChevronDown } from 'lucide-react';

export interface RASelectItem {
  id: string;
  label: string;
}

interface RASelectProps {
  label?: string;
  'aria-label'?: string;
  items: RASelectItem[];
  className?: string;
  buttonClassName?: string;
  value?: string;
  onChange?: (value: string) => void;
  selectedKey?: Key;
  onSelectionChange?: (key: Key) => void;
  isDisabled?: boolean;
  name?: string;
  placeholder?: string;
}

export const RASelect = ({
  label,
  'aria-label': ariaLabel,
  items,
  className = '',
  buttonClassName = '',
  value,
  onChange,
  selectedKey,
  onSelectionChange,
  isDisabled,
  name,
  placeholder,
}: RASelectProps) => {
  return (
    <AriaSelect
      className={`relative ${className}`}
      aria-label={!label ? ariaLabel : undefined}
      selectedKey={value ?? selectedKey}
      onSelectionChange={(key: Key | null) => {
        if (onChange && key !== null) onChange(String(key));
        if (onSelectionChange && key !== null) onSelectionChange(key);
      }}
      isDisabled={isDisabled}
      name={name}
      placeholder={placeholder}
    >
      {label && (
        <AriaLabel className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">
          {label}
        </AriaLabel>
      )}
      <AriaButton
        className={`flex items-center justify-between gap-2 w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-primary rounded-xl p-3 text-sm outline-none transition-all text-text-primary font-bold cursor-pointer ${buttonClassName}`}
      >
        <AriaSelectValue className="truncate flex-1 text-left" />
        <ChevronDown size={14} className="opacity-50 shrink-0" />
      </AriaButton>
      <AriaPopover className="w-[--trigger-width] bg-bg-surface border border-border-strong rounded-xl shadow-2xl overflow-hidden z-[9999] animate-fade-in">
        <AriaListBox className="max-h-60 overflow-y-auto custom-scroll" items={items}>
          {(item) => (
            <AriaListBoxItem
              id={item.id}
              textValue={item.label}
              className="px-4 py-3 text-sm transition-colors cursor-pointer outline-none text-text-secondary font-medium hover:bg-bg-surface-elevated selected:bg-nature-mint/30 selected:text-nature-primary selected:font-bold focus:bg-bg-surface-elevated"
            >
              {item.label}
            </AriaListBoxItem>
          )}
        </AriaListBox>
      </AriaPopover>
    </AriaSelect>
  );
};
