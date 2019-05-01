import React from 'react';
import './main-container.scss';

export default function MainContainer(props: any) {
  return <div className="main-container">{props.children}</div>;
}
