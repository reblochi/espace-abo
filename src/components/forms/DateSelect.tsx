// Composant date en 3 selects (jour, mois, annee)
// Stocke la valeur au format YYYY-MM-DD pour compatibilite avec les champs date existants

'use client';

const MOIS_OPTIONS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];

const JOURS_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, '0'),
  label: String(i + 1).padStart(2, '0'),
}));

const currentYear = new Date().getFullYear();

function generateYearOptions(minYear: number) {
  return Array.from({ length: currentYear - minYear + 1 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));
}

interface DateSelectProps {
  label: string;
  value: string; // format YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  minYear?: number; // defaut 1900
}

export function DateSelect({
  label,
  value,
  onChange,
  error,
  required,
  minYear = 1900,
}: DateSelectProps) {
  // Parser la valeur existante
  const parts = value ? value.split('-') : [];
  const year = parts[0] || '';
  const month = parts[1] || '';
  const day = parts[2] || '';

  const yearOptions = generateYearOptions(minYear);

  const handleChange = (part: 'day' | 'month' | 'year', val: string) => {
    const newDay = part === 'day' ? val : day;
    const newMonth = part === 'month' ? val : month;
    const newYear = part === 'year' ? val : year;

    if (newDay && newMonth && newYear) {
      onChange(`${newYear}-${newMonth}-${newDay}`);
    } else if (!newDay && !newMonth && !newYear) {
      onChange('');
    } else {
      // Valeur partielle : stocker ce qu'on a pour ne pas perdre la saisie
      onChange(`${newYear || '0000'}-${newMonth || '00'}-${newDay || '00'}`);
    }
  };

  const hasError = !!error;

  return (
    <div>
      <label className="form-gov-label">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <select
            value={day}
            onChange={(e) => handleChange('day', e.target.value)}
            className={`form-gov-select ${hasError ? 'form-gov-error' : ''}`}
          >
            <option value="">Jour</option>
            {JOURS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={month}
            onChange={(e) => handleChange('month', e.target.value)}
            className={`form-gov-select ${hasError ? 'form-gov-error' : ''}`}
          >
            <option value="">Mois</option>
            {MOIS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={year}
            onChange={(e) => handleChange('year', e.target.value)}
            className={`form-gov-select ${hasError ? 'form-gov-error' : ''}`}
          >
            <option value="">Année</option>
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p className="form-gov-error-msg">{error}</p>
      )}
    </div>
  );
}

export default DateSelect;
