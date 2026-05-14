import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function NavBar() {
  const [labels, setLabels] = useState({});
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "1"
  );
  const location = useLocation();
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  // Session check interval in milliseconds (e.g., every 5 minutes)
  const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;

  const handleSessionExpired = useCallback(() => {
    localStorage.clear();
    navigate("/login", { replace: true });
  }, [navigate]);

  const checkAuthToken = useCallback(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      handleSessionExpired();
      return false;
    }
    return true;
  }, [handleSessionExpired]);

  const fetchLabel = async () => {
    try {
      if (!checkAuthToken()) return;

      const labelResponse = await axios.get(
        `/api/language-labels/getLabels?formId=6&regLId=${localStorage.getItem(
          "language"
        )}`
      );

      setLabels(labelResponse.data[0]);
    } catch (error) {
      console.error("Error fetching labels:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleSessionExpired();
      }
    }
  };

  const fetchProfile = async () => {
    try {
      if (!checkAuthToken()) return;

      const token = localStorage.getItem("authToken");
      const profileResponse = await axios.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(profileResponse.data || {});
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleSessionExpired();
      }
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchProfile();
    fetchLabel();

    // Set up periodic session check
    const sessionCheckInterval = setInterval(() => {
      fetchProfile();
    }, SESSION_CHECK_INTERVAL);

    // Set up axios interceptor for global error handling
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          handleSessionExpired();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup
    return () => {
      clearInterval(sessionCheckInterval);
      axios.interceptors.response.eject(interceptor);
    };
  }, [handleSessionExpired]);

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      labels[12] || "Are you sure you want to log out?"
    );
    if (confirmLogout) {
      try {
        // Call logout API if available
        localStorage.clear();
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Error during logout:", error);
        localStorage.clear();
        navigate("/login", { replace: true });
      }
    }
  };

  const handleDashboard = () => {
    if (!checkAuthToken()) return;
    
    navigate("/dashboard", {
      state: {
        userId: localStorage.getItem("userID"),
        regLid: localStorage.getItem("language"),
        mappingUserId: localStorage.getItem("userID"),
      },
    });
  };

  const handleLanguageChange = () => {
    if (!checkAuthToken()) return;

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
            {/* <li className="nav-item dropdown">
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
                <a className="dropdown-item">
                  <i className="ti-user text-primary"></i>
                  <div className="text-success">
                    {data.displayName || data.username || data.role || "Profile"}
                  </div>
                </a>
                <Link to="/change-password" className="dropdown-item">
                  <i className="ti-key text-primary"></i>
                  {labels[1] || "Change Password"}
                </Link>

                <Link to="/profile" className="dropdown-item">
                  <i className="ti-settings text-primary"></i>
                  {labels[2] || "Profile"}
                </Link>

                <button className="dropdown-item" onClick={handleLogout}>
                  <i className="ti-power-off text-danger"></i>
                  <span className="text-danger"> {labels[3] || "Logout"}</span>
                </button>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
