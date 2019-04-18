import React, { useState } from 'react';
import {
    Collapse,
    Navbar,
    NavbarToggler,
    Nav,
    NavItem
} from 'reactstrap';
import { Link } from 'react-router-dom'
import { useBalance } from '../../state/wallet';
import './top-bar.css'

export default function TopBar(props: any) {
  const [isOpen, setIsOpen] = useState(false);
  const balance = useBalance();
        return (
            <div>
                <Navbar color="light" light expand="md">
                    <Link className="navbar-brand" to="/">
                      hookedin
                    </Link>
                    <span>Balance: {balance} satoshis</span>
                    <NavbarToggler onClick={() => setIsOpen(!isOpen)} />
                    <Collapse isOpen={isOpen} navbar style={{ textAlign: 'right'}}>
                        <Nav className="ml-auto" navbar>
                            <NavItem>
                                <Link className="nav-link" to="/settings">Settings</Link>
                            </NavItem>
                            <NavItem>
                                <Link className="nav-link" to="/about">About</Link>
                            </NavItem>
                            <NavItem>
                                <Link className="nav-link" to="/contact">Contact</Link>
                            </NavItem>
                        </Nav>
                    </Collapse>
                </Navbar>
            </div>
        );

}