import React, { useState, useEffect } from 'react';
import { Collapse, Navbar, Nav, NavItem } from 'reactstrap';
import { Link, withRouter } from 'react-router-dom';
import './top-bar.scss';
import '../../img/fa-js/all.min.js'; // This is FontAwesome's SVG+JS file. It is needed for the stacking icons style in the notification bell.
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
            <span className="fa-layers fa-fw fa-lg">
              <i className="fa fa-bell" style={{ fontSize: '20px' }} />
              <span className="fa-layers-counter notification-counter">28</span>
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
              <i className="fa fa-lg fa-sign-out-alt"  style={{ color: 'rgba(0, 0, 0, 0.5)' }} />
            </NavItem>
          </Nav>
        </Collapse>
      </Navbar>
    </div>
  );
}
