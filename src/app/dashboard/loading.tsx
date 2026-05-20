import { Skeleton } from '@/components/skeleton'

export default function DashboardLoading() {
  return (
    <div className="animate-fade-in" style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton style={{ width: 200, height: 32 }} />
          <Skeleton style={{ width: 300, height: 20 }} />
        </div>
        <Skeleton style={{ width: 120, height: 36 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton style={{ width: 100, height: 16 }} />
              <Skeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
            </div>
            <Skeleton style={{ width: 60, height: 36 }} />
            <Skeleton style={{ width: '80%', height: 14 }} />
          </div>
        ))}
      </div>

      <div className="card">
        <Skeleton style={{ width: 150, height: 24, marginBottom: 20 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} style={{ width: '100%', height: 60 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
