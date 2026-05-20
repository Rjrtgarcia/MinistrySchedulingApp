'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumb-nav" aria-label="Breadcrumb">
      <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }} className="hover:text-primary">
        <Home size={14} />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="breadcrumb-segment">
          <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          {item.href ? (
            <Link href={item.href} className="breadcrumb-label hover:text-primary" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>
              {item.label}
            </Link>
          ) : (
            <span className="breadcrumb-label" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
