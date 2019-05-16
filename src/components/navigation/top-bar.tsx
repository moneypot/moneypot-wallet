import React, { useState, useEffect } from 'react';
import { Collapse, Navbar, Nav, NavItem } from 'reactstrap';
import { Link, withRouter } from 'react-router-dom';
import './top-bar.scss';
import { wallet, useBalance } from '../../state/wallet';

export default withRouter(TopBar);

function TopBar(props: any) {
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
            hookedin
          </Link>
        ) : (
          ''
        )}
        <span className="wallet-info">
          {props.isMobile ? '' : wallet.db.name} {balance} sat
        </span>
        <span className="nav-item-right">
          <button type="button" className="navbar-toggler">
            <span className="fa-stack fa-lg fa-stack-bell" data-count="28">
              <i className="fa fa-bell fa-stack-1x xfa-inverse" />
            </span>
          </button>
          <button type="button" className="navbar-toggler" onClick={() => setIsOpen(!isOpen)}>
            <i className="fa fa-chevron-square-down" />
          </button>
        </span>
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
            <NavItem className="new-section">
              <Link className="nav-link" to="/transfers">
                Transfers
              </Link>
            </NavItem>
            <NavItem>
              <Link className="nav-link" to="/bounties">
                Bounties
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
