import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import { Collapse, Navbar, Nav, NavItem } from 'reactstrap';
import { Link, withRouter } from 'react-router-dom';
import { wallet, useBalance } from '../../state/wallet';
import SyncBtn from './sync-btn';

export default withRouter(TopBar);

function TopBar(props: RouteComponentProps & { isMobile: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() =>
    props.history.listen(() => {
      setIsOpen(false);
    })
  );

  const balance = useBalance();

  return (
    <div className="top-bar">
      <Navbar light>
        {props.isMobile ? (
          <Link className="navbar-brand" to="/">
            moneypot
          </Link>
        ) : (
          ''
        )}
        <span className="wallet-info">
          <b style={{ fontWeight: 'bold' }}>{props.isMobile ? '' : wallet.db.name} </b> {balance + ' sat'}
        </span>
        <div className="nav-item-right">
          {props.isMobile ? <SyncBtn /> : ''}
          <button type="button" className="navbar-toggler" onClick={() => setIsOpen(!isOpen)}>
            <i className="fa fa-cog" />
          </button>
        </div>
        <Collapse isOpen={isOpen} navbar>
          <Nav className="ml-auto" navbar>
            <NavItem>
              <Link className="nav-link" to="/backup">
                Backup
              </Link>
            </NavItem>
            <NavItem>
              <Link className="nav-link" to="/settings">
                Settings
              </Link>
            </NavItem>
            <NavItem>
              <Link className="nav-link" to="/faq">
                FAQ / General  
              </Link>
            </NavItem>
            <NavItem className="new-section">
              <Link className="nav-link" to="/addresses">
                Addresses
              </Link>
            </NavItem>
            <NavItem>
              <Link className="nav-link" to="/coins">
                Coins
              </Link>
            </NavItem>
            <NavItem>
              <Link className="nav-link" to="/hookins">
                Hookins
              </Link>
            </NavItem>
            <NavItem>
              <Link className="nav-link" to="/config">
                Config
              </Link>
            </NavItem>
            <NavItem>
              <Link className="nav-link" to="/hookouts">
                Hookouts
              </Link>
            </NavItem>
            <NavItem className="new-section">
              <Link className="nav-link" to="/support">
                Support
              </Link>
            </NavItem>
            <NavItem>
              <Link className="nav-link" to="/contact">
                Contact
              </Link>
            </NavItem>
            <NavItem>
              <i className="fa fa-lg fa-sign-out-alt" style={{ color: 'rgba(0, 0, 0, 0.5)' }} />
            </NavItem>
          </Nav>
        </Collapse>
      </Navbar>
    </div>
  );
}
