import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function NavBar() {
  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
        localStorage.clear();
        window.location.href = "/"; // Adjust the URL as needed
    }
};
  return (
   <>
   <nav className="navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row  bg-white">
          <div className="text-center navbar-brand-wrapper ">
            <img src="logo.png" alt="logo" style={{ height: "60px" }}   />
          </div>
          <div className="navbar-menu-wrapper d-flex align-items-center justify-content-end">
            <ul className="navbar-nav navbar-nav-right">
              <li className="nav-item dropdown">
                <a
                  className="nav-link count-indicator dropdown-toggle"
                  id="notificationDropdown"
                  href="#"
                  data-toggle="dropdown"
                >
                  <i className="icon-bell mx-0"></i>
                  <span className="count"></span>
                </a>
                <div
                  className="dropdown-menu dropdown-menu-right navbar-dropdown preview-list"
                  aria-labelledby="notificationDropdown"
                >
                  <p className="mb-0 font-weight-normal float-left dropdown-header">
                    Notifications
                  </p>
                  <a className="dropdown-item preview-item">
                    <div className="preview-thumbnail">
                      <div className="preview-icon bg-success">
                        <i className="ti-info-alt mx-0"></i>
                      </div>
                    </div>
                    <div className="preview-item-content">
                      <h6 className="preview-subject font-weight-normal">
                        This feature coming soon
                      </h6>
                      <p className="font-weight-light small-text mb-0 text-muted">
                        Just now
                      </p>
                    </div>
                  </a>
                </div>
              </li>
              <li className="nav-item nav-profile dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  data-toggle="dropdown"
                  id="profileDropdown"
                >
                  <img src="images/faces/profile.svg" alt="profile" />
                </a>
                <div
                  className="dropdown-menu dropdown-menu-right navbar-dropdown"
                  aria-labelledby="profileDropdown"
                >
                  <a className="dropdown-item">
                    <i className="ti-key text-primary"></i>
                    Change Password
                  </a>
                  <a className="dropdown-item">
                    <i className="ti-user text-primary"></i>
                    Profile
                  </a>
                 
                  <a className="dropdown-item" onClick={handleLogout}>
                    <i className="ti-power-off text-primary"></i>
                    Logout
                  </a> 
                </div>
              </li>
            </ul>
          </div>
        </nav>
   </>
  )
}
