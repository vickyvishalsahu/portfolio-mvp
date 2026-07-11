const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;

export type PriceAgeKeyPrefix = 'holdings.priceAge' | 'dashboard.priceAge';

export type Translate = (key: string, options?: Record<string, unknown>) => string;

export const formatPriceAge = (
  updatedAt: string | null,
  t: Translate,
  keyPrefix: PriceAgeKeyPrefix
): string => {
  if (!updatedAt) return t(`${keyPrefix}.never`);

  const minutes = Math.floor((Date.now() - new Date(updatedAt).getTime()) / MS_PER_MINUTE);
  if (minutes < 1) return t(`${keyPrefix}.justNow`);
  if (minutes === 1) return t(`${keyPrefix}.oneMinAgo`);
  if (minutes < MINUTES_PER_HOUR) return t(`${keyPrefix}.minsAgo`, { mins: minutes });

  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  return hours === 1 ? t(`${keyPrefix}.oneHourAgo`) : t(`${keyPrefix}.hoursAgo`, { hrs: hours });
};
