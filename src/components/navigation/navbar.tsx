import React, { useEffect, useState } from "react";
import './navbar.scss';
import { Link, withRouter } from 'react-router-dom'

export default withRouter(NavBar)

function NavBar(props: any) {
  const [selection, setSelection] = useState('dashboard');
  useEffect(() => {
    setSelection(props.location.pathname);
  });


  function NavLink(props: any) {

      let isActive = props.path === props.to;
      let className = isActive ? 'active-nav' : '';

      return(
        <Link className={className} to={props.to}>
          {props.children}
        </Link>
      );

  }

 return (
            <div className="custom-navbar">
              {props.isMobile? '' : <div><Link className="navbar-brand" to="/">hookedin</Link><p>v 0.1</p></div>}
              <NavLink to="/" path={props.location.pathname}>Dashboard</NavLink>
              <NavLink path={props.location.pathname} to="/receive/bitcoin">Receive Bitcoin</NavLink>
              <NavLink path={selection} to="/receive/direct">Receive Direct</NavLink>
                <NavLink path={selection} to="/send">Send</NavLink>
                <NavLink path={props.location.pathname} to="/history">History</NavLink>
            </div>
        );
}


