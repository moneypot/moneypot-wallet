import React from 'react';
import { useEffect } from 'react';
import { useTable, useSortBy, useGlobalFilter } from 'react-table';
import { Table, Input, InputGroup, InputGroupAddon, Button, InputGroupText } from 'reactstrap';

// I give up on vanilla table sorting, it's too slow

// TODO: source @?
// export default function useSortableData<T, K extends keyof T>(items: T[], config: { key: K; direction: string } | null) {
//   const [sortConfig, setSortConfig] = useState(config);

//   // this shit is extremely inefficient, TODO
//   const sortedItems = useMemo(() => {
//     let sortableItems = [...items];
//     if (sortConfig !== null) {
//       sortableItems.sort((a, b) => {
//         if (a[sortConfig.key] < b[sortConfig.key]) {
//           return sortConfig.direction === 'ascending' ? -1 : 1;
//         }
//         if (a[sortConfig.key] > b[sortConfig.key]) {
//           return sortConfig.direction === 'ascending' ? 1 : -1;
//         }
//         return 0;
//       });
//     }
//     return sortableItems;
//   }, [items, sortConfig]);

//   const requestSort = (key: K) => {
//     let direction = 'ascending';
//     if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
//       direction = 'descending';
//     }
//     setSortConfig({ key, direction });
//   };

//   return { items: sortedItems, requestSort, sortConfig };
// }

// interface SI {
//   allValues: string
// }

// export function useTableSearch<T>( searchVal: string | undefined, retrieve: T[]) {
// console.log('$called!')
//   const [filteredData, setFilteredData] = useState<(T | null)[]>(retrieve);
//   const [origData] = useState<T[]>(retrieve);
//   const [searchIndex, setSearchIndex] = useState<SI[]>([]);
//   useEffect(() => {
//     const crawl = (retrieve: { [x: string]: any; }, allValues?: string[] | undefined) => {
//       if (!allValues) allValues = [];
//       for (var key in retrieve) {
//         if (typeof retrieve[key] === "object") crawl(retrieve[key], allValues);
//         else allValues.push(retrieve[key] + " ");
//       }
//       return allValues;
//     };
//     const fetchData = async () => {
//       const searchInd = retrieve.map((retrieve: T) => {
//       const allValues = crawl(retrieve);
//       return { allValues: allValues.toString() };
//       });
//       setSearchIndex(searchInd);
//     };
//     fetchData();
//   }, []);

//   useEffect(() => {
//     if (searchVal) {
//       const reqData = searchIndex.map((retrieve: { allValues: string; }, index: number) => {
//         if (retrieve.allValues.toLowerCase().indexOf(searchVal.toLowerCase()) >= 0)
//           return origData[index];
//         return null;
//       });
//       setFilteredData(

//         (reqData).filter((retrieve) => {
//           if (retrieve) return true;
//           return false;
//         })
//       );
//     } else setFilteredData(origData);
//   }, [searchVal, origData, searchIndex]);

//   return { filteredData };
// };

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

  useEffect(() => {
    // TODO
  }, []);

  // Render the UI for your table
  return (
    <>
      <InputGroup className="col-sm-3" style={{ marginBottom: 10 }}>
        <Input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} placeholder={'Search any'} />
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
