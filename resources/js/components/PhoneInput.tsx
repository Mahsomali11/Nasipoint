import { useState, useEffect, useRef } from 'react';
import { Phone, ChevronDown, MapPin } from 'lucide-react';

export interface CountryCode {
  code: string;
  country: string;
  dialCode: string;
  phoneLength: number;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'SO', country: 'Somalia', dialCode: '+252', phoneLength: 9, flag: '🇸🇴' },
  { code: 'KE', country: 'Kenya', dialCode: '+254', phoneLength: 9, flag: '🇰🇪' },
  { code: 'AE', country: 'UAE', dialCode: '+971', phoneLength: 9, flag: '🇦🇪' },
  { code: 'GB', country: 'United Kingdom', dialCode: '+44', phoneLength: 10, flag: '🇬🇧' },
  { code: 'US', country: 'United States', dialCode: '+1', phoneLength: 10, flag: '🇺🇸' },
  { code: 'ET', country: 'Ethiopia', dialCode: '+251', phoneLength: 9, flag: '🇪🇹' },
  { code: 'TZ', country: 'Tanzania', dialCode: '+255', phoneLength: 9, flag: '🇹🇿' },
  { code: 'UG', country: 'Uganda', dialCode: '+256', phoneLength: 9, flag: '🇺🇬' },
  { code: 'DJ', country: 'Djibouti', dialCode: '+253', phoneLength: 8, flag: '🇩🇯' },
  { code: 'SD', country: 'Sudan', dialCode: '+249', phoneLength: 9, flag: '🇸🇩' },
  { code: 'SS', country: 'South Sudan', dialCode: '+211', phoneLength: 9, flag: '🇸🇸' },
  { code: 'RW', country: 'Rwanda', dialCode: '+250', phoneLength: 9, flag: '🇷🇼' },
  { code: 'BI', country: 'Burundi', dialCode: '+257', phoneLength: 8, flag: '🇧🇮' },
  { code: 'SA', country: 'Saudi Arabia', dialCode: '+966', phoneLength: 9, flag: '🇸🇦' },
  { code: 'QA', country: 'Qatar', dialCode: '+974', phoneLength: 8, flag: '🇶🇦' },
  { code: 'EG', country: 'Egypt', dialCode: '+20', phoneLength: 10, flag: '🇪🇬' },
  { code: 'TR', country: 'Turkey', dialCode: '+90', phoneLength: 10, flag: '🇹🇷' },
  { code: 'IN', country: 'India', dialCode: '+91', phoneLength: 10, flag: '🇮🇳' },
  { code: 'CN', country: 'China', dialCode: '+86', phoneLength: 11, flag: '🇨🇳' },
  { code: 'NG', country: 'Nigeria', dialCode: '+234', phoneLength: 10, flag: '🇳🇬' },
  { code: 'ZA', country: 'South Africa', dialCode: '+27', phoneLength: 9, flag: '🇿🇦' },
  { code: 'GH', country: 'Ghana', dialCode: '+233', phoneLength: 9, flag: '🇬🇭' },
];

function formatPhoneDisplay(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}

interface PhoneInputProps {
  value: string; // raw digits without country code
  onChange: (digits: string) => void;
  selectedCountry: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  error?: string;
  className?: string;
}

export function getInternationalPhone(country: CountryCode, digits: string): string {
  return `${country.dialCode}${digits}`;
}

export default function PhoneInput({ value, onChange, selectedCountry, onCountryChange, error, className }: PhoneInputProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length <= selectedCountry.phoneLength) {
      onChange(raw);
    }
  };

  const filtered = COUNTRY_CODES.filter(c =>
    c.country.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search)
  );

  const isValid = value.length === 0 || value.length === selectedCountry.phoneLength;

  return (
    <div className={className} ref={ref}>
      <div className={`flex items-center rounded-xl border-2 transition-colors ${error || (!isValid && value.length > 0) ? 'border-destructive' : 'border-input focus-within:border-primary'} bg-accent/30`}>
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1 pl-3 pr-2 py-3.5 shrink-0 text-sm font-medium text-foreground hover:bg-accent/50 rounded-l-xl transition-colors"
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-sm">{selectedCountry.dialCode}</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>

        <div className="w-px h-7 bg-border shrink-0" />

        {/* Phone input */}
        <input
          type="tel"
          value={value ? formatPhoneDisplay(value) : ''}
          onChange={handleInput}
          placeholder={`${'0'.repeat(selectedCountry.phoneLength).replace(/(.{2})(.{3})(.*)/, '$1 $2 $3').trim()}`}
          className="flex-1 px-3 py-3.5 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
        />
      </div>

      {/* Error / hint */}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      {!error && !isValid && value.length > 0 && (
        <p className="text-destructive text-xs mt-1">
          Phone number must contain exactly {selectedCountry.phoneLength} digits for {selectedCountry.country}.
        </p>
      )}
      {isValid && value.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          Will be stored as {getInternationalPhone(selectedCountry, value)}
        </p>
      )}

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-border">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full px-3 py-2 text-sm rounded-lg bg-accent/30 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onCountryChange(c);
                    setDropdownOpen(false);
                    setSearch('');
                    // Reset phone if switching country and current value exceeds new length
                    if (value.length > c.phoneLength) onChange('');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors ${c.code === selectedCountry.code ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 text-left">{c.country}</span>
                  <span className="text-muted-foreground">{c.dialCode}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No countries found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to detect country from geolocation
export function useGeoCountry(onDetected: (country: CountryCode) => void) {
  const [detecting, setDetecting] = useState(false);
  const [asked, setAsked] = useState(false);

  const detect = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    setAsked(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const countryCode = data.countryCode;
          if (countryCode) {
            const match = COUNTRY_CODES.find(c => c.code === countryCode);
            if (match) onDetected(match);
          }
        } catch {
          // silent fail, user can select manually
        } finally {
          setDetecting(false);
        }
      },
      () => setDetecting(false),
      { timeout: 10000 }
    );
  };

  return { detect, detecting, asked };
}
