import type { User } from '@/lib/types'
import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'size-6 text-[0.625rem]',
  md: 'size-8 text-xs',
}

export function UserAvatar({
  member,
  size = 'sm',
  className,
}: {
  member: Pick<User, 'name' | 'initials' | 'color'>
  size?: keyof typeof sizeMap
  className?: string
}) {
  return (
    <span
      title={member.name}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold ring-2 ring-card',
        sizeMap[size],
        member.color,
        className,
      )}
      aria-label={member.name}
    >
      {member.initials}
    </span>
  )
}
