'use client';

import { useEffect, useState } from 'react';

export function ShopVisitors({ shopId }: { shopId: string }) {
  const [names, setNames] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch('/api/shops/visitors', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Could not load visitors');
        const data = await response.json();
        if (!controller.signal.aborted) {
          setNames(data.names);
          setFailed(false);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 30_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [shopId]);

  return (
    <section className="zd-shop-banner" aria-labelledby="shop-visitors-title">
      <div className="zd-shop-banner-info">
        <div>
          <h2 id="shop-visitors-title">Visitors today{names && !failed ? ` (${names.length})` : ''}</h2>
          {failed ? <p>Could not load visitors.</p> : !names ? <p>Loading visitors…</p> : names.length === 0 ? (
            <p>No Google visitors today.</p>
          ) : (
            <ul className="mt-2 max-h-48 overflow-y-auto">
              {names.map((name, index) => <li key={index}>{name}</li>)}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
