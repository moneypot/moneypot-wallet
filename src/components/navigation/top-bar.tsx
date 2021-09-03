import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from 'react-router';
import { Collapse, Navbar, Nav, NavItem, Button, Alert, Tooltip } from 'reactstrap';
import { Link, withRouter, useLocation } from 'react-router-dom';
import { wallet, useBalance } from '../../state/wallet';
import SyncBtn from './sync-btn';

export default withRouter(TopBar);

// low priority
const TestnetAlert = (isMobile: boolean) => {
  const [visible, setVisible] = useState(localStorage.getItem(`dismissedTestnetAlert-${wallet.db.name}`) ? false : true);

  const [tooltipOpen, setTooltipOpen] = useState(false);

  const toggle = () => setTooltipOpen(!tooltipOpen);

  const onDismiss = () => {setVisible(false), localStorage.setItem(`dismissedTestnetAlert-${wallet.db.name}`, 'true')};

  return (
    <div>
     {isMobile ? <Button color="warning" id="t_">Warning!</Button> : <Alert color="warning"  isOpen={visible} toggle={onDismiss} style={{width: 'max-content'}}>
    Warning! This is a <a href="https://en.bitcoin.it/wiki/Testnet">testnet</a> wallet! 
    </Alert>} 
      {isMobile && <Tooltip placement="bottom" isOpen={tooltipOpen} target="t_" toggle={toggle}>
      This is a <a href="https://en.bitcoin.it/wiki/Testnet">testnet</a> wallet!</Tooltip>}
      </div>
  ) ;
}




function TopBar(props: RouteComponentProps & { isMobile: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() =>
    props.history.listen(() => {
      setIsOpen(false);
    })
  );

  const balance = useBalance();
  let location = useLocation();
  let TDifference: number | undefined;
  if (wallet.config.custodian.wipeDate) {
    TDifference = +new Date(wallet.config.custodian.wipeDate) - +new Date();
  }
  let warning: undefined | JSX.Element = undefined;
  if (TDifference && TDifference / (1000 * 60 * 60 * 24) < 7 && location.pathname === '/') {
    warning = props.isMobile ? (
      <Link to="/faq"><Button color="danger">
      Warning!
      </Button></Link>
    ) : (
      <Button color="danger">
        {' '}
        Warning! <Link to="/faq">It seems that </Link> this custodian will soon wipe or has already wiped!
      </Button>
    );
  }

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
        {/* TODO make warning class  */}
        <span className="wallet-info">
          {warning} {' '} {wallet.config.custodian.currency === 'tBTC' ? TestnetAlert(props.isMobile) : undefined}
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
            <NavItem>
              <Link className="nav-link" to="/config">
                Config
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
              <Link className="nav-link" to="/invoices">
                Invoices
              </Link>
            </NavItem>
            <NavItem>
              <Link className="nav-link" to="/payments">
                Payments
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
            {/* <NavItem>
              <Link className="nav-link" to="/contact">
                Contact
              </Link>
            </NavItem> */}
            <NavItem>
              <i className="fa fa-lg fa-sign-out-alt" style={{ color: 'rgba(0, 0, 0, 0.5)' }} />
            </NavItem>
          </Nav>
        </Collapse>
      </Navbar>
    </div>
  );
}
