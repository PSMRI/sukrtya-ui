import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function NavBar() {
  const [labels, setLabels] = useState({});
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "1"
  );
  const location = useLocation();
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchLabel = async () => {
      try {
        const labelResponse = await axios.get(
          `sukrtya/api/language-labels/getLabels?formId=6&regLId=${localStorage.getItem(
            "language"
          )}`
        );

        setLabels(labelResponse.data[0]); // Assuming response is an array with labels as key-value pairs
      } catch (error) {
        console.error("Error fetching labels:", error);
      }
    };

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const profileResponse = await axios.post(
          "/sukrtya/api/get-profile",
          {}, // Empty request body if no data needs to be sent
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setData(profileResponse.data);
        if (profileResponse.data.status !== "success") {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("authToken"); // Clear the token
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
    fetchLabel();
  }, []);

  const navigate = useNavigate();
  const handleLogout = () => {
    const confirmLogout = window.confirm(
      labels[12] || "Are you sure you want to log out?"
    );
    if (confirmLogout) {
      localStorage.clear();
      window.location.href = "/"; // Adjust the URL as needed
    }
  };
  const handleDashboard = () => {
    navigate("/dashboard", {
      state: {
        userId: localStorage.getItem("userID"),
        regLid: 1,
        mappingUserId: localStorage.getItem("userID"),
      },
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
          <img
            src="logo.png"
            alt="logo"
            style={{ height: "60px" }}
            onClick={handleDashboard}
            title="click to go to dashboard"
          />
        </div>
        <div className="navbar-menu-wrapper d-flex align-items-center justify-content-end">
          <ul className="navbar-nav navbar-nav-right">
            <li className="nav-item dropdown">
              <button
                className="language-toggle-button"
                onClick={handleLanguageChange}
                style={{
                  display: location.pathname.includes("entry-form")
                    ? "none"
                    : "block",
                }}
              >
                <span
                  style={{ fontWeight: language === "1" ? "bold" : "normal" }}
                >
                  English
                </span>{" "}
                /{" "}
                <span
                  style={{ fontWeight: language !== "1" ? "bold" : "normal" }}
                >
                  हिंदी
                </span>
              </button>
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
                <i className="ti-user text-primary"></i>
                  {data.message ? (
                    <div className="text-success">{data.message}</div>
                  ) : (
                    <div className="text-danger">{data.error}</div>
                  )}
                </a>
                <Link to="/change-password" className="dropdown-item">
                  <i className="ti-key text-primary"></i>
                  {labels[1] || "Change Password"}
                </Link>

                <Link to="/profile" className="dropdown-item">
                  <i className="ti-settings text-primary"></i>
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
  );
}
