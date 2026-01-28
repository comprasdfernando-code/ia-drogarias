'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ConfirmInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const type = params.get('type');

    // confirmação ou reset → manda pro painel
    if (type === 'recovery') {
      router.replace('/profissional/painel');
    } else {
      router.replace('/profissional/painel');
    }
  }, [params, router]);

  return <p>Processando confirmação...</p>;
}
