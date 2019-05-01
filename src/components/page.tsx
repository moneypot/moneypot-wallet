import React from 'react';

export default function Page(props: any) {
  return (
    <div>
      <h2 className="main-heading">The page is: {props.page}</h2>
    </div>
  );
}
