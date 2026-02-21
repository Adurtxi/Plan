import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange?: (val: string) => void;
  options: Option[];
  name?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
}

export const CustomSelect = ({ value, onChange, options, name, buttonClassName = "", dropdownClassName = "" }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOpt = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full h-full" ref={ref}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 appearance-none outline-none focus:outline-none w-full ${buttonClassName}`}
      >
        <span className="truncate flex-1 text-center font-inherit">{selectedOpt?.label || value}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 opacity-50 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute left-0 right-0 top-[110%] min-w-max bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-[9999] animate-fade-in ${dropdownClassName}`}>
          <div className="max-h-60 overflow-y-auto w-full custom-scroll">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (onChange) onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 flex items-center justify-between ${opt.value === value ? 'bg-nature-mint/30 text-nature-primary font-bold' : 'text-gray-600 font-medium'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
