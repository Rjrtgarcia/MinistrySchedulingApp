export function Skeleton({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton-loader ${className || ''}`}
      style={{
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-3)',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        ...style
      }}
      {...props}
    />
  )
}
