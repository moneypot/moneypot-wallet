import React from 'react';
import { useEffect } from 'react';
import { useTable, useSortBy, useGlobalFilter } from 'react-table';
import { Table, Input, InputGroup, InputGroupAddon, Button, InputGroupText } from 'reactstrap';

// TODO type this
export function CustomTable({ columns, data }: any) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setGlobalFilter,
    state: { globalFilter },
  } = useTable(
    {
      columns,
      data,
    },
    useGlobalFilter,
    useSortBy
  ) as any; // this library is badly typed.. :/?

  // Render the UI for your table
  return (
    <>
      <InputGroup className="col-sm-3" style={{ marginBottom: 10 }}>
        <Input value={globalFilter === undefined ? '' : globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={'Search any'} />
        <InputGroupAddon addonType="append">
          <InputGroupText>
            <i className="fa fa-search" />
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      <Table {...getTableProps()} hover bordered responsive>
        <thead>
          {headerGroups.map(
            (headerGroup: {
              getHeaderGroupProps: () => JSX.IntrinsicAttributes & React.ClassAttributes<HTMLTableRowElement> & React.HTMLAttributes<HTMLTableRowElement>;
              headers: any[];
            }) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(
                  (column: {
                    getHeaderProps: (
                      arg0: any
                    ) => JSX.IntrinsicAttributes & React.ClassAttributes<HTMLTableHeaderCellElement> & React.ThHTMLAttributes<HTMLTableHeaderCellElement>;
                    getSortByToggleProps: () => any;
                    isSorted: any;
                    isSortedDesc: any;
                    render: (arg0: string) => React.ReactNode;
                  }) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className={column.isSorted ? (column.isSortedDesc ? 'sort-desc' : 'sort-asc') : ''}
                    >
                      {column.render('Header')}
                      <span className="float-right tableIcon">
                        {column.isSorted ? (
                          column.isSortedDesc ? (
                            <i className="fas fa-arrow-down" />
                          ) : (
                            <i className="fas fa-arrow-up" />
                          )
                        ) : (
                          <i className="fas fa-arrows-alt-v" />
                        )}
                      </span>
                    </th>
                  )
                )}
              </tr>
            )
          )}
        </thead>

        <tbody {...getTableBodyProps()}>
          {rows.map(
            (
              row: {
                getRowProps: () => JSX.IntrinsicAttributes & React.ClassAttributes<HTMLTableRowElement> & React.HTMLAttributes<HTMLTableRowElement>;
                cells: any[];
              },
              i: any
            ) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(
                    (cell: {
                      getCellProps: () => JSX.IntrinsicAttributes &
                        React.ClassAttributes<HTMLTableDataCellElement> &
                        React.TdHTMLAttributes<HTMLTableDataCellElement>;
                      render: (arg0: string) => React.ReactNode;
                    }) => {
                      return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                    }
                  )}
                </tr>
              );
            }
          )}
        </tbody>
      </Table>
    </>
  );
}
