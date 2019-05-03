import React, { useState, useEffect } from 'react';
import { Collapse, Navbar, NavbarToggler, Nav, NavItem } from 'reactstrap';
import { Link, withRouter } from 'react-router-dom';
import './top-bar.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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

  function MobileNavigation() {
    if (props.isMobile) {
      return (
        <div>
          <NavItem>
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
        </div>
      );
    }
  }
  return (
    <div className="top-bar">
      <Navbar color="light" light expand="md">
        {props.isMobile ? (
          <Link className="navbar-brand" to="/">
            hookedin
          </Link>
        ) : (
          ''
        )}

        <span className="wallet-info">
          {wallet.db.name} {balance} sat
        </span>

        <NavbarToggler onClick={() => setIsOpen(!isOpen)} />
        <Collapse isOpen={isOpen} navbar style={{ textAlign: 'right' }}>
          <Nav className="ml-auto" navbar>
            <NavItem>
              <Link className="nav-link" to="/settings">
                Settings
              </Link>
            </NavItem>
            <NavItem>
              <Link className="nav-link" to="/about">
                About
              </Link>
            </NavItem>
            <NavItem>
              <Link className="nav-link" to="/contact">
                Contact
              </Link>
            </NavItem>
            <NavItem>
              <span className="fa-layers fa-fw fa-lg">
                <FontAwesomeIcon icon="bell" />
                <span className="fa-layers-counter notification-counter">28</span>
              </span>
              <FontAwesomeIcon icon="cog" className="fa-lg" />
              <FontAwesomeIcon icon="sign-out-alt" className="fa-lg" />
            </NavItem>
            {MobileNavigation()}
          </Nav>
        </Collapse>
      </Navbar>
    </div>
  );
}
