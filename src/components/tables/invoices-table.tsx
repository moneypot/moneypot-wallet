import React from 'react';
import { Link } from 'react-router-dom';
import * as hi from 'moneypot-lib';

import { useClaimableStatuses } from '../../state/wallet';

import * as Docs from '../../wallet/docs';
import { notError } from '../../util';
import InvoiceSettledStatus from 'moneypot-lib/dist/status/invoice-settled';
import { Table } from 'reactstrap';
import useSortableData from './table-util';

export const InvoicesTable = ({ invoices }: { invoices: (Docs.Claimable & hi.POD.LightningInvoice)[] }) => {
  // first create table info - then put it in sorter.
  let filteredInvoices = [];
  for (const invoice of invoices) {
    const pro = notError(hi.decodeBolt11(invoice.paymentRequest));

    const currentTime = new Date().getTime();
    const expiryTime = new Date(pro.timeExpireDateString).getTime();
    const p = currentTime > expiryTime ? 'Invoice has expired!' : 'Invoice is still valid';

    const statuses = useClaimableStatuses(invoice.hash);
    let status = 'false';
    if (statuses) {
      for (const s of statuses) {
        if (s instanceof InvoiceSettledStatus) {
          status = 'true';
        }
      }
    }

    filteredInvoices.push({
      hash: invoice.hash,
      paymentRequest: invoice.paymentRequest,
      amount: pro.satoshis != undefined ? pro.satoshis : `any amount of `,
      expired: p,
      paid: status,
      created: invoice.created,
    });
  }

  const { items, requestSort, sortConfig } = useSortableData(filteredInvoices, null);
  const getClassNamesFor = (name: string) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  return (
    <Table hover className="table">
      <thead>
        <tr>
          <th>
            <button type="button" onClick={() => requestSort('hash')} className={getClassNamesFor('hash')}>
              hash
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('paymentRequest')} className={getClassNamesFor('paymentRequest')}>
              invoice
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('amount')} className={getClassNamesFor('amount')}>
              amount
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('expired')} className={getClassNamesFor('expired')}>
              expired
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('paid')} className={getClassNamesFor('paid')}>
              paid
            </button>
          </th>
          <th>
            <button type="button" onClick={() => requestSort('created')} className={getClassNamesFor('created')}>
              created
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.hash}>
            <td>
              <Link to={`/claimables/${item.hash}`}>{item.hash.substring(0, 32)}...</Link>
            </td>
            <td>
              <Link to={`/claimables/${item.hash}`}>{item.paymentRequest.substring(0, 32)}...</Link>
            </td>
            <td>{item.amount} sat</td>
            <td>{item.expired}</td>

            <td>{item.paid}</td>
            <td>{item.created.toISOString()}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
