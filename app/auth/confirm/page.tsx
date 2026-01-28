'use client';

import { Suspense } from 'react';
import ConfirmInner from './ConfirmInner';

export default function ConfirmPage() {
  return (
    <Suspense fallback={<p>Confirmando acesso...</p>}>
      <ConfirmInner />
    </Suspense>
  );
}
