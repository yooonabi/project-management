import type { ReactNode } from 'react'

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb?: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
}) {
  if (!breadcrumb && !title && !description && !actions) return null

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {breadcrumb || title || description ? (
          <div>
            {breadcrumb ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{breadcrumb}</div>
            ) : null}
            {title ? (
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance text-foreground">{title}</h1>
            ) : null}
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
        ) : (
          <div />
        )}
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
