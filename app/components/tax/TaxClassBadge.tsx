import { useTranslation } from 'react-i18next';
import type { TaxClass } from '@/domains/portfolio/types';

const BADGE_STYLES: Record<TaxClass, string> = {
  LTCG:     'bg-emerald-50 text-emerald-600',
  STCG:     'bg-amber-50 text-amber-700',
  FLAT_30:  'bg-slate-100 text-gray-600',
  TAXABLE:  'bg-amber-50 text-amber-700',
  TAX_FREE: 'bg-emerald-50 text-emerald-600',
};

type Props = { taxClass: TaxClass };

export const TaxClassBadge = ({ taxClass }: Props) => {
  const { t } = useTranslation();
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_STYLES[taxClass]}`}>
      {t(`tax.classes.${taxClass}`)}
    </span>
  );
};
