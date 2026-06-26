import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

let cachedSymbol = 'MOP$';
let cacheLoaded = false;

export function useCurrency() {
  const [symbol, setSymbol] = useState(cachedSymbol);

  useEffect(() => {
    if (cacheLoaded) { setSymbol(cachedSymbol); return; }
    supabase.from('mt_site_settings').select('value').eq('key', 'currency').maybeSingle().then(({ data }) => {
      const s = (data?.value as { symbol?: string })?.symbol ?? 'MOP$';
      cachedSymbol = s;
      cacheLoaded = true;
      setSymbol(s);
    });
  }, []);

  function fmt(amount: number) {
    return `${symbol}${amount.toFixed(0)}`;
  }

  return { symbol, fmt };
}
