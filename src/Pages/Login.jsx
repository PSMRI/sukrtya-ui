import React, { useState } from "react";
import { useNavigate } from "react-router";
import LanguageData from "../Data/LanguageList.json";

export default function Login() {
  const allowedLanguages = ["hi", "en"];

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    language: "",
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
  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (formData.username === "test" && formData.password === "123456") {
      // Validation successful, redirect to dashboard with username
      alert("Welcome " + formData.username);
      navigate("/dashboard", { state: { formData } });
      setSubmitted(true);
    } else {
      // Validation failed
      setErrors({ global: "Invalid email or password" });
    }
  };
  // Validation logic
  const validate = (data) => {
    const newErrors = {};
    if (!data.username) {
      newErrors.username = "Username is required";
    }

    if (!data.password) {
      newErrors.password = "Password is required";
    } else if (data.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!data.language) {
      newErrors.language = "Language is required";
    }
    return newErrors;
  };

  return (
    <>
      <div class="container-scroller">
        <div class="container-fluid page-body-wrapper full-page-wrapper">
          <div class="content-wrapper d-flex align-items-center auth px-0">
            <div class="row w-100 mx-0">
              <div class="col-lg-4 mx-auto">
                <div class="auth-form-light text-left py-5 px-4 px-sm-5">
                  <div class="brand-logo">
                    <img src="logo.png" alt="logo" />
                  </div>
                  <h4>Hello! let's get started</h4>
                  <h6 class="font-weight-light">Sign in to continue.</h6>
                  <form class="pt-3" onSubmit={handleSubmit} noValidate>
                    <div class="form-group">
                      <input
                        type="text"
                        className={`form-control form-control-sm ${
                          errors.username ? "is-invalid" : ""
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
                    <div class="form-group">
                      <input
                        type="password"
                        className={`form-control form-control-sm ${
                          errors.password ? "is-invalid" : ""
                        }`}
                        placeholder="Password"
                        aria-label="Password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      {errors.password && (
                        <div className="invalid-feedback">
                          {errors.password}
                        </div>
                      )}
                    </div>
                    <div class="form-group">
                      <select
                        name="language"
                        className={`form-control form-control-sm ${
                          errors.language ? "is-invalid" : ""
                        }`}
                        value={formData.language}
                        onChange={handleChange}
                      >
                        <option value="">Please select language..</option>
                        {LanguageData.filter((option) =>
                          allowedLanguages.includes(option.code)
                        )
                          .sort((a, b) => a.code.localeCompare(b.code))
                          .map((getLanguage, index) => (
                            <option value={getLanguage.code} key={index}>
                              {getLanguage.nativeName}
                            </option>
                          ))}
                      </select>
                      {errors.language && (
                        <div className="invalid-feedback">
                          {errors.language}
                        </div>
                      )}
                    </div>
                    <div class="mt-3">
                      <button
                        type="submit"
                        className="btn btn-block btn-primary btn-lg font-weight-medium auth-form-btn"
                      >
                        Login
                      </button>
                      {errors.global && (
                        <p style={{ color: "red" }}>{errors.global}</p>
                      )}{" "}
                    </div>
                    <div class="my-2 d-flex justify-content-between align-items-center">
                      <div class="form-check">
                        <label class="form-check-label text-muted">
                          <input type="checkbox" class="form-check-input" />
                          Keep me signed in
                        </label>
                      </div>
                      <a href="#" class="auth-link text-black">
                        Forgot password?
                      </a>
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
