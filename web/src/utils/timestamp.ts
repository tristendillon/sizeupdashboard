type DateTimeFormatVariant =
  | 'relative'
  | 'short-12h'
  | 'short-24h'
  | 'long-12h'
  | 'long-24h'
  | 'short-date'
  | 'long-date';

type DateTimeFormatter = (timestamp: number, localeOverride?: string) => string;

export function timeStampFormatter(variant: DateTimeFormatVariant): DateTimeFormatter {
  switch (variant) {
    case 'relative': {
      const rtfCache = new Map<string, Intl.RelativeTimeFormat>();

      return (timestamp, locale = navigator.language) => {
        const now = Date.now();
        const diff = timestamp - now;
        const absDiff = Math.abs(diff);

        const units = [
          { limit: 60_000, divisor: 1000, unit: 'second' },
          { limit: 3_600_000, divisor: 60_000, unit: 'minute' },
          { limit: 86_400_000, divisor: 3_600_000, unit: 'hour' },
          { limit: 604_800_000, divisor: 86_400_000, unit: 'day' },
          { limit: 2_592_000_000, divisor: 604_800_000, unit: 'week' },
          { limit: 31_536_000_000, divisor: 2_592_000_000, unit: 'month' },
          { limit: Infinity, divisor: 31_536_000_000, unit: 'year' },
        ];

        const { unit, divisor } = units.find(u => absDiff < u.limit)!;
        const rtf = rtfCache.get(locale) ?? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        rtfCache.set(locale, rtf);
        return rtf.format(Math.round(diff / divisor), unit as Intl.RelativeTimeFormatUnit);
      };
    }

    case 'short-date':
    case 'long-date': {
      const options: Intl.DateTimeFormatOptions =
        variant === 'short-date'
          ? { month: 'short', day: 'numeric' }
          : { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };

      const dtfCache = new Map<string, Intl.DateTimeFormat>();

      return (timestamp, locale = navigator.language) => {
        if (!dtfCache.has(locale)) {
          dtfCache.set(locale, new Intl.DateTimeFormat(locale, options));
        }
        return dtfCache.get(locale)!.format(new Date(timestamp));
      };
    }

    case 'short-12h':
    case 'short-24h':
    case 'long-12h':
    case 'long-24h': {
      const hour12 = variant.includes('12h');
      const long = variant.startsWith('long');
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12,
        ...(long && { year: 'numeric', weekday: 'short' }),
      };

      const dtfCache = new Map<string, Intl.DateTimeFormat>();

      return (timestamp, locale = navigator.language) => {
        if (!dtfCache.has(locale)) {
          dtfCache.set(locale, new Intl.DateTimeFormat(locale, options));
        }
        return dtfCache.get(locale)!.format(new Date(timestamp));
      };
    }
  }
}
