import React from 'react';
import { Link, withRouter } from 'react-router-dom';

export default withRouter(SubNavbar);

function SubNavbar(props: any) {
  function NavLink(props: any) {
    let isActive = props.path === props.to;
    let activeId = isActive ? 'active-sub-nav' : '';

    return <Link id={activeId} {...props} />;
  }

  return (
    <div className="custom-sub-navbar">
      <NavLink to="/send" path={props.location.pathname}>
        <span className="navbar-link-text">Bitcoin</span>
      </NavLink>
      <NavLink path={props.location.pathname} to="/send/lightning">
        <span className="navbar-link-text">Lightning</span>
      </NavLink>
    </div>
  );
}
