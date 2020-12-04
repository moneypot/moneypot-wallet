import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as hi from 'moneypot-lib';

import { useClaimableStatuses, getAllStatuses } from '../../state/wallet';

import * as Docs from '../../wallet/docs';
import { notError } from '../../util';
import InvoiceSettledStatus from 'moneypot-lib/dist/status/invoice-settled';
import { Table } from 'reactstrap';
import { CustomTable } from './table-util';

export const InvoicesTable = ({ invoices }: { invoices: (Docs.Claimable & hi.POD.LightningInvoice)[] }) => {
  // first create table info - then put it in sorter.
  let filteredInvoices = [];
  const statuses = getAllStatuses();

  for (const invoice of invoices) {
    const pro = notError(hi.decodeBolt11(invoice.paymentRequest));

    const currentTime = new Date().getTime();
    const expiryTime = new Date(pro.timeExpireDateString).getTime();
    const p = currentTime > expiryTime ? 'Invoice has expired!' : 'Invoice is still valid';

    let description;
    for (const tag of pro.tags) {
      if (tag.tagName === 'description') {
        description = tag.data;
      }
    }

    let memo = description != null ? description : '';

    // const statuses = useClaimableStatuses(invoice.hash);
    let status = 'false';
    if (statuses) {
      for (const s of statuses) {
        if (s.claimableHash.toPOD() === invoice.hash) {
          if (s instanceof InvoiceSettledStatus) {
            status = 'true';
          }
        }
      }
    }

    filteredInvoices.push({
      hash: invoice.hash,
      paymentRequest: invoice.paymentRequest,
      memo: memo,
      amount: pro.satoshis != undefined ? pro.satoshis : `any amount of `,
      paid: status,
      expired: p,
      created: invoice.created.toString(),
    });
  }

  const columns = useMemo(
    () => [
      {
        Header: 'Lightning Invoices',
        columns: [
          {
            Header: 'Hash',
            accessor: 'hash',
            Cell: (e: { value: React.ReactNode }) => <Link to={`/claimables/${e.value}`}>{e.value}</Link>,
          },
          {
            Header: 'PaymentRequest',
            accessor: 'paymentRequest',
          },
          {
            Header: 'Memo',
            accessor: 'memo',
          },
          {
            Header: 'Amount',
            accessor: 'amount',
          },
          {
            Header: 'Paid',
            accessor: 'paid',
          },
          {
            Header: 'Expired',
            accessor: 'expired',
          },
          {
            Header: 'Created',
            accessor: 'created',
          },
        ],
      },
    ],
    []
  );

  return <CustomTable columns={columns} data={filteredInvoices} />;
};
