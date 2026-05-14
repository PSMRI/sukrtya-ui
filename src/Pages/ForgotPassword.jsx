import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post('/api/forgot-password', { email });
      setMessage(response.data.message || 'Password reset instructions have been sent to your email.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'An error occurred while processing your request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-scroller">
      <div className="container-fluid page-body-wrapper full-page-wrapper">
        <div className="content-wrapper d-flex align-items-center auth px-0">
          <div className="row w-100 mx-0">
            <div className="col-lg-4 mx-auto">
              <div className="auth-form-light text-left py-5 px-4 px-sm-5">
                <div className="brand-logo">
                  <img src="logo.png" alt="logo" />
                </div>
                <h4>Forgot Password</h4>
                <h6 className="font-weight-light">Enter your email to reset your password.</h6>
                
                <form className="pt-3" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  {message && <div className="alert alert-success">{message}</div>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  
                  <div className="mt-3">
                    <button
                      type="submit"
                      className="btn btn-block btn-primary btn-lg font-weight-medium auth-form-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <img
                            src="./loader.gif"
                            alt="Please wait..."
                            style={{ width: "20px", height: "20px" }}
                          />
                          Please Wait...
                        </span>
                      ) : (
                        "Reset Password"
                      )}
                    </button>
                  </div>
                  
                  <div className="text-center mt-4 font-weight-light">
                    Remember your password? {" "}
                    <span
                      onClick={() => navigate("/login")}
                      className="text-primary"
                      style={{ cursor: "pointer" }}
                    >
                      Login
                    </span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 