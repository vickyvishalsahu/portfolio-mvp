import { cn } from '@/domains/shared/utils'

type Props = {
  classNameList: string | string[]
}

export const SkeletonLoading = ({ classNameList }: Props) => {
  const baseClass = 'animate-pulse bg-gray-800 rounded-lg'

  const renderSingle = (className: string, key?: string | number) => (
    <div key={key} className={cn(baseClass, className)} />
  )

  if (!Array.isArray(classNameList)) return renderSingle(classNameList)

  return <>{classNameList.map((className, index) => renderSingle(className, className + index))}</>
}
