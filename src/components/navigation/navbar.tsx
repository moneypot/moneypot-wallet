import React, { useState } from 'react';
import './navbar.scss';
import { Link, withRouter } from 'react-router-dom';

export default withRouter(NavBar);

function NavBar(props: any) {
  const [isDashboardHover, setIsDashboardHover] = useState(false);
  const dashboardHover = { onMouseEnter: () => setIsDashboardHover(true), onMouseLeave: () => setIsDashboardHover(false) };

  const [isReceiveHover, setIsReceiveHover] = useState(false);
  const receiveHover = { onMouseEnter: () => setIsReceiveHover(true), onMouseLeave: () => setIsReceiveHover(false) };

  const [isSendHover, setIsSendHover] = useState(false);
  const sendHover = { onMouseEnter: () => setIsSendHover(true), onMouseLeave: () => setIsSendHover(false) };

  const [isHistoryHover, setIsHistoryHover] = useState(false);
  const historyHover = { onMouseEnter: () => setIsHistoryHover(true), onMouseLeave: () => setIsHistoryHover(false) };

  function NavLink(props: any) {
    let isActive = props.path === props.to;
    let activeId = isActive ? 'active-nav' : '';

    return <Link id={activeId} {...props} />;
  }
  let hoverDashboardClassName = isDashboardHover ? 'dashboard-hover' : '';
  let hoverReceiveClassName = isReceiveHover ? 'receive-hover' : '';
  let hoverSendClassName = isSendHover ? 'send-hover' : '';
  let hoverHistoryClassName = isHistoryHover ? 'history-hover' : '';

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
      <NavLink to="/" path={props.location.pathname} className={hoverDashboardClassName} {...dashboardHover}>
        <div className="navbar-img-container dashboard" />
        <span className="navbar-link-text">Dashboard</span>
      </NavLink>
      <NavLink path={props.location.pathname} to="/receive" className={hoverReceiveClassName} {...receiveHover}>
        <div className="navbar-img-container receive" />
        <span className="navbar-link-text">Receive</span>
      </NavLink>
      <NavLink path={props.location.pathname} to="/send" className={hoverSendClassName} {...sendHover}>
        <div className="navbar-img-container send" />
        <span className="navbar-link-text">Send</span>
      </NavLink>
      <NavLink path={props.location.pathname} to="/history" className={hoverHistoryClassName} {...historyHover}>
        <div className="navbar-img-container history" />
        <span className="navbar-link-text">History</span>
      </NavLink>
    </div>
  );
}
