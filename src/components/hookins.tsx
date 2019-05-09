import React from 'react';

import { useHookins } from '../state/wallet';

import HookinsTable from './hookins-table';

export default function Hookins() {
  const hookins = useHookins();
  return (
    <div>
      <h1>All Hookins</h1>
      <HookinsTable hookins={hookins} />
    </div>
  );
}
