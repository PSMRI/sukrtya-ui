
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";

// Safe localStorage helpers
function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Optionally log error
  }
}

export default function Login() {
  const [loading, setLoading] = useState(false); // Loading state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  // Handle form input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true); // Start loading
    // Set a flag to check if the component is still mounted
    let isMounted = true;

    try {
      const response = await axios.post(
        "/sukrtya/api/login",
        {
          userName: formData.username,
          password: formData.password,
        }
      );
      //console.log(response.data.token);
      const { userID, profileName, userName,assessmentID } = response.data.user;

      if (!userName) {
        throw new Error("Token not provided in response");
      }

      if (isMounted) {

        // Update state only if the component is still mounted
        safeLocalStorageSet("authToken", response.data.token);
        safeLocalStorageSet("userID", userID);
        safeLocalStorageSet("profileName", profileName);
        safeLocalStorageSet("username", userName);
        // Default language to "1" since selection is removed
        safeLocalStorageSet("language", "1");
        safeLocalStorageSet("isApprover", response.data.user.approvalStatus);
        //alert("Welcome - " + profileName);
        navigate("/dashboard", {
          state: { userId: userID, regLid: "1", mappingUserId: userID },
        });
        setSubmitted(true);
      }
    } catch (err) {
      if (isMounted) {
        if (err.response) {
          setErrors({
            global:
              err.response.data.message || "Login failed. Please try again.",
          });
        } else if (err.request) {
          setErrors({
            global: "No response from server. Please check your network.",
          });
        } else {
          setErrors({
            global: err.message || "Error in login request. Please try again.",
          });
        }
      }
    } finally {
      setLoading(false); // Stop loading
    }
    // Cleanup function to set `isMounted` to false if the component unmounts
    return () => {
      isMounted = false;
    };
  };
  // Validation logic
  const validate = (data) => {
    const newErrors = {};
    if (!data.username) {
      newErrors.username = "Username is required";
    }

    if (!data.password) {
      newErrors.password = "Password is required";
    } else if (data.password.length < 3) {
      newErrors.password = "Password must be at least 3 characters";
    }
    return newErrors;
  };
  useEffect(() => {
    let isMounted = true;
    return () => {
      // Set isMounted to false when component unmounts
      isMounted = false;
    };
  }, []);

  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };
  return (
    <>
      <div className="container-scroller">
        <div className="container-fluid page-body-wrapper full-page-wrapper">
          <div className="content-wrapper d-flex align-items-center auth px-0">
            <div className="row w-100 mx-0">
              <div className="col-lg-4 mx-auto">
                <div className="auth-form-light text-left py-5 px-4 px-sm-5">
                  <div className="brand-logo">
                    <img src="logo.png" alt="logo" />
                  </div>
                  <h4>Hello! let's get started</h4>
                  <h6 className="font-weight-light">Sign in to continue.</h6>
                  <form className="pt-3" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                      <input
                        type="text"
                        className={`text-primary form-control form-control-sm ${errors.username ? "is-invalid" : ""
                          }`}
                        placeholder="Username"
                        aria-label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                      />
                      {errors.username && (
                        <div className="invalid-feedback">
                          {errors.username}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <div style={{ position: "relative" }}>
                        <input
                          type={passwordVisible ? "text" : "password"}
                          className={`text-primary form-control form-control-sm ${errors.password ? "is-invalid" : ""
                            }`}
                          placeholder="Password"
                          aria-label="Password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        {formData.password && (
                          <span
                            onClick={togglePasswordVisibility}
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "20px",
                              transform: "translateY(-50%)",
                              cursor: "pointer",
                            }}
                          >
                            {passwordVisible ? "👁️" : "👁️‍🗨️"}
                          </span>)}
                        {errors.password && (
                          <div className="invalid-feedback">
                            {errors.password}
                          </div>
                        )}
                      </div></div>
                    {/* Removed language selection dropdown */}
                    <div className="mt-3">
                      <button disabled={loading}
                        type="submit"
                        className="btn btn-block btn-primary btn-lg font-weight-medium auth-form-btn"
                      >
                        {loading ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <img
                              src="./loader.gif"
                              alt="PLease wait..."
                              style={{ width: "20px", height: "20px" }}
                            />
                            Please Wait...
                          </span>
                        ) : ("Login")}
                      </button>
                      {errors.global && (
                        <p style={{ color: "red" }}>{errors.global}</p>
                      )}{" "}
                    </div>
                    
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
