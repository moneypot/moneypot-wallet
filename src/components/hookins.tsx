import React from 'react';
import { RouteComponentProps } from 'react-router';

export default function(props: RouteComponentProps<{ hash: string }>) {
  return <p>TODO</p>;
}

// import React from 'react';

// import { useHookins } from '../state/wallet';

// import HookinsTable from './hookins-table';

// export default function Hookins() {
//   const hookins = useHookins();
//   return (
//     <div>
//       <h1>All Hookins</h1>
//       <HookinsTable hookins={hookins} />
//     </div>
//   );
// }
