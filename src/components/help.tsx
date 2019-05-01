import React, { useEffect, useState } from 'react';
import { Link, withRouter } from 'react-router-dom';

export default withRouter(NavBar);

function NavBar(props: any) {
  const [selection, setSelection] = useState('dashboard');
  useEffect(() => {
    setSelection(props.location.pathname);
  });

  const [isHoverClass, setIsHoverClass] = useState(false);
  const detectHoverNav = { onMouseEnter: () => setIsHoverClass(true), onMouseLeave: () => setIsHoverClass(false) };

  function NavLink(props: any) {
    let hoverClassName = isHoverClass ? 'hovered' : '';

    return (
      <Link className={hoverClassName} to={props.to} {...detectHoverNav}>
        {props.children}
      </Link>
    );
  }

  return (
    <div className="custom-navbar">
      <NavLink to="/" path={props.location.pathname}>
        Dashboard
      </NavLink>
    </div>
  );
}
