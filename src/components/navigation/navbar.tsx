import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import Logo from '../../img/logo.svg';
import SyncBtn from './sync-btn';

export default withRouter(NavBar);

function NavBar(props: any) {
  function NavLink(props: any) {
    let isActive = props.path === props.to || props.path === props.to + '/lightning';
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
            <img src={Logo} alt="moneypot logo" className="logo" />
            moneypot
          </Link>
          <div><span>v 0.1</span>
          <SyncBtn/>
          </div>
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
        <i className="fal fa-question-square" />
        <span className="navbar-link-text">Support</span>
      </NavLink>
    </div>
  );
}
