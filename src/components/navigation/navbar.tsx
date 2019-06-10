import React from 'react';
import { Link, withRouter } from 'react-router-dom';

export default withRouter(NavBar);

function NavBar(props: any) {
  function NavLink(props: any) {
    let isActive = props.path === props.to;
    let activeId = isActive ? 'active-nav' : '';

    return <Link id={activeId} {...props} />;
  }

  return (
    <div className="custom-navbar">
      {props.isMobile ? (
        ''
      ) : (
        <div>
          <Link className="navbar-brand" to="/">
            hookedin
          </Link>
          <p>v 0.1</p>
        </div>
      )}
      <NavLink to="/" path={props.location.pathname}>
        <i className="fal fa-desktop-alt" />
        <span className="navbar-link-text">Dashboard</span>
      </NavLink>
      <NavLink path={props.location.pathname} to="/receive">
        <i className="fal fa-arrow-from-top" />
        <span className="navbar-link-text">Receive</span>
      </NavLink>
      <NavLink path={props.location.pathname} to="/send">
        <i className="fal fa-arrow-to-top" />
        <span className="navbar-link-text">Send</span>
      </NavLink>
      <NavLink path={props.location.pathname} to="/history">
        <i className="fal fa-history" />
        <span className="navbar-link-text">History</span>
      </NavLink>
      <NavLink path={props.location.pathname} to="/support">
        <i className="fab fa-telegram" />
        <span className="navbar-link-text">Support</span>
      </NavLink>
    </div>
  );
}
