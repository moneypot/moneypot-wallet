import React from 'react';
import { wallet } from '../../state/wallet';

export default function SyncBtn() {

    function handleClick() {
        wallet.sync();

    }

  return (
          <button 
          type="button" 
          className="btn btn-sm btn-primary sync-btn"
          onClick={handleClick}
          >sync
          </button>
  );
}
