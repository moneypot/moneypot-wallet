import React, { useEffect, useState } from 'react';
import { wallet } from '../../state/wallet';

export default function SyncBtn() {
  const [SyncingWithWorkers, setSyncingWithWorkers] = useState(false);
  useEffect(() => {
    const hasSyncWorkers = localStorage.getItem(`${wallet.db.name}-setting5-hasSyncWorkers`);
    if (hasSyncWorkers) {
      if (hasSyncWorkers === 'true') {
        setSyncingWithWorkers(true);
      } else setSyncingWithWorkers(false);
    }
  }, []);

  function handleClick() {
    if (SyncingWithWorkers) {
      wallet.sync();
    } else {
      wallet.sync();
    }
  }

  return (
    <button type="button" className="btn btn-sm btn-primary sync-btn" onClick={handleClick}>
      sync
    </button>
  );
}
