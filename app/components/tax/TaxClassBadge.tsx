import { useTranslation } from 'react-i18next';
import type { TaxClass } from '@/domains/portfolio/types';

const BADGE_STYLES: Record<TaxClass, string> = {
  LTCG:     'bg-green-900 text-green-300',
  STCG:     'bg-amber-900 text-amber-300',
  FLAT_30:  'bg-gray-800 text-gray-300',
  TAXABLE:  'bg-amber-900 text-amber-300',
  TAX_FREE: 'bg-green-900 text-green-300',
};

type Props = { taxClass: TaxClass };

export const TaxClassBadge = ({ taxClass }: Props) => {
  const { t } = useTranslation();
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${BADGE_STYLES[taxClass]}`}>
      {t(`tax.classes.${taxClass}`)}
    </span>
  );
};
