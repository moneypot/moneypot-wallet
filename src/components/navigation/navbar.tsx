import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import SyncBtn from './sync-btn';

export default withRouter(NavBar);

function NavBar(props: any) {
  function NavLink(props: any) {
    let isActive = props.path === props.to;
    let activeId = isActive ? 'active-nav' : '';

    return <div className={activeId}><Link id={activeId} {...props} /></div>;
  }

  const pathname = props.location.pathname;

  return (
    <div className="custom-navbar">
      {props.isMobile ? (
        ''
      ) : (
        <div>
          <Link to="/" className={ pathname === '/' ? 'prev-non-active-nav navbar-brand' : 'navbar-brand' }>
          <i className="fad fa-cauldron logo" />
            moneypot
          </Link>
          <div/>
        </div>
      )}
   <NavLink path={pathname} to="/" className={ pathname === '/send' ? 'prev-non-active-nav' : '' }>
        <i className="fad fa-file-chart-line" />
        <span className="navbar-link-text">Transactions</span>
      </NavLink>
      
      <NavLink path={pathname} to="/send" className={ pathname === '/receive' ? 'prev-non-active-nav' : pathname === '/' ? 'post-non-active-nav' : ''  }>
        <i className="fad fa-paper-plane" />
        <span className="navbar-link-text">Send</span>
      </NavLink>
     
      <NavLink path={pathname} to="/receive" className={ pathname === '/receive/lightning' ? 'prev-non-active-nav' : pathname === '/send' ? 'post-non-active-nav' : '' }>
        <i className="fad fa-arrow-alt-from-top" />
        <span className="navbar-link-text">Receive</span>
      </NavLink>
 
      <NavLink path={pathname} to="/receive/lightning" className={  pathname === '/receive' ? 'post-non-active-nav' : '' }>
        <i className="fad fa-bolt" />
        <span className="navbar-link-text">Receive <br/>Lightning</span>
      </NavLink>

      {props.isMobile ? (
        ''
      ) : (
        <div>
        <div className={  pathname === '/receive/lightning' ? 'post-non-active-nav' : '' }><SyncBtn/></div>
      </div>
   
      )}
     </div>  
  );
}
