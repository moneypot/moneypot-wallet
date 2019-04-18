import React from "react";
import './navbar.scss';
import { Link } from "react-router-dom";

export default function NavBar(props: any) {
        return (
            <div className="custom-navbar">
              <Link to="/">Dashboard</Link>
              <Link to="/receive/bitcoin">Receive Bitcoin</Link>
              <Link to="/receive/direct">Receive Direct</Link>
                <Link to="/send">Send</Link>
                <Link to="/history">History</Link>
            </div>
        );
}


