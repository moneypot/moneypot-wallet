import React, { useEffect, useState } from 'react';
import { wallet } from '../../state/wallet';

export default function SyncBtn() {
  // TODO: add support for..
  function handleClick() {
    wallet.sync();
  }

  return (
    <button type="button" className="btn btn-sm btn-primary sync-btn" onClick={handleClick}>
      sync
    </button>
  );
}
