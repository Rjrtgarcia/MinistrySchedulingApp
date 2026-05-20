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
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
      <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }} className="hover:text-primary">
        <Home size={14} />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          {item.href ? (
            <Link href={item.href} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }} className="hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
