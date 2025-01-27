import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NavBar() {
  const [labels, setLabels] = useState({});
  const [language, setLanguage] = useState(localStorage.getItem("language") || "1");

  useEffect(() => {
    const fetchLabel = async () => {
      try {
        const labelResponse = await axios.get(
          `sukrtya/api/language-labels/getLabels?formId=6&regLId=${localStorage.getItem("language")}`
        );
        setLabels(labelResponse.data[0]); // Assuming response is an array with labels as key-value pairs
      } catch (error) {
        console.error("Error fetching labels:", error);
      }
    };
    fetchLabel();
  }, []);
  const navigate = useNavigate();
  const handleLogout = () => {
    const confirmLogout = window.confirm(labels[12] || "Are you sure you want to log out?");
    if (confirmLogout) {
      localStorage.clear();
      window.location.href = "/"; // Adjust the URL as needed
    }
  };
  const handleDashboard = () => {
    navigate("/dashboard", {
      state: { userId: localStorage.getItem("userID"), regLid: 1, mappingUserId: localStorage.getItem("userID") },
    });
  };

  const handleLanguageChange = () => {
    const newLanguage = localStorage.getItem("language") === "1" ? "2" : "1";
    localStorage.setItem("language", newLanguage);
    window.location.reload();
  };
  return (
    <>
      <nav className="navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row  bg-white">
        <div className="text-center navbar-brand-wrapper ">

          <img src="logo.png" alt="logo" style={{ height: "60px" }} onClick={handleDashboard} title="click to go to dashboard" />
        </div>
        <div className="navbar-menu-wrapper d-flex align-items-center justify-content-end">
          <ul className="navbar-nav navbar-nav-right">
            <li className="nav-item dropdown">
              <button style={{ display : "none" }}
                className="language-toggle-button"
                onClick={handleLanguageChange}

              >
                <span style={{ fontWeight: language === "1" ? "bold" : "normal" }}>English</span> / <span style={{ fontWeight: language !== "1" ? "bold" : "normal" }}>हिंदी</span>

              </button>
            </li>
            {/* <li className="nav-item dropdown">
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
                 {labels[13] || "Notifications"}
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
            </li> */}
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
                <Link to="/change-password" className="dropdown-item">
                  <i className="ti-key text-primary"></i>
                  {labels[1] || "Change Password"}
                </Link>

                <Link to="/profile" className="dropdown-item">
                  <i className="ti-user text-primary"></i>
                  {labels[2] || "Profile"}
                </Link>


                <a className="dropdown-item" onClick={handleLogout}>
                  <i className="ti-power-off text-danger"></i>
                  <span className="text-danger"> {labels[3] || "Logout"}</span>
                </a>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </>
  )
}
