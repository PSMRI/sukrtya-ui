import { useEffect, useState } from 'react'
import Base from '../Components/Base'
import { useNavigate } from 'react-router';
import axios from 'axios';

export default function ChangePassword() {
    const [labels, setLabels] = useState({});
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
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
     
    const navigate = useNavigate();
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
            return;
        }
    
        setLoading(true);
    
        try {
            const token = localStorage.getItem("authToken");
            const response = await axios.post(
                "/sukrtya/api/change-password",
                {
                    oldPassword: formData.oldPassword,
                    newPassword: formData.newPassword,
                    confirmPassword: formData.confirmPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            alert(response.data.message);
            navigate("/login");
        } catch (error) {
            if (error.response && error.response.status === 401) {
                // Token expired or unauthorized access
                alert("Session expired. Please log in again.");
                localStorage.removeItem("authToken"); // Clear the token
                navigate("/login"); // Redirect to login page
            } else {
                setErrors({
                    global:
                        error.response?.data?.message || "An unexpected error occurred.Please login again after logout.",
                });
            }
            setLoading(false);
        }
    };
    
    // Validation logic
    const validate = (data) => {
        const newErrors = {};
        if (!data.oldPassword) {
            newErrors.oldPassword = labels[7] || "Old Password is required";
        }

        if (!data.newPassword) {
            newErrors.newPassword = labels[8] || "New Password is required";
        } else if (data.newPassword.length < 3) {
            newErrors.newPassword = labels[9] || "New Password must be at least 3 characters";
        }

        if (!data.confirmPassword) {
            newErrors.confirmPassword = labels[10] || "Confirm Password is required";
        } else if (data.confirmPassword !== data.newPassword) {
            newErrors.confirmPassword = labels[11] || "New & Confirm Passwords do not match";
        }
        return newErrors;
    };

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const toggleOldPasswordVisibility = () => {
        setShowOldPassword((prevState) => !prevState);
    };
    const toggleNewPasswordVisibility = () => {
        setShowNewPassword((prevState) => !prevState);
    };
    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword((prevState) => !prevState);
    };
    return (
        <Base title="Change Password">
            <div className="main-panel">
                <div className="content-wrapper">
                    <div className="row">
                        <div className='col-md-4'></div>
                        <div className="col-md-4 grid-margin stretch-card mt-5">
                            <div className="card">
                                <div className="card-body">
                                    <form className="pt-3" onSubmit={handleSubmit} noValidate>
                                        <h4 className="card-title">{labels[1] || "Change Password"}</h4>
                                        <p className="card-description">

                                        </p>

                                        <div className="form-group">

                                            <label>{labels[4] || "Old Password"}</label>
                                            <div style={{ position: "relative" }}>
                                                <input autoComplete='off'
                                                    type={showOldPassword ? "text" : "password"}
                                                    className={`form-control ${errors.oldPassword ? "is-invalid" : ""
                                                        }`}
                                                    placeholder={labels[4] || "Old password"}
                                                    aria-label="oldPassword"
                                                    name="oldPassword"
                                                    value={formData.oldPassword}
                                                    onChange={handleChange}
                                                />
                                                {formData.oldPassword && (
                                                    <span className='form-password '
                                                        onClick={toggleOldPasswordVisibility}
                                                        style={{
                                                            position: "absolute",
                                                            right: "25px",
                                                            top: "20px",
                                                            transform: "translateY(-50%)",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {showOldPassword ? "👁️" : "👁️‍🗨️"}
                                                    </span>)}
                                                {errors.oldPassword && (
                                                    <div className="invalid-feedback">
                                                        {errors.oldPassword}
                                                    </div>
                                                )}
                                            </div>


                                        </div>
                                        <div className="form-group">
                                            <label>{labels[5] || "New Password"}</label>
                                            <div style={{ position: "relative" }}>
                                                <input autoComplete='off'
                                                    type={showNewPassword ? "text" : "password"}
                                                    className={`form-control  form-password ${errors.newPassword ? "is-invalid" : ""
                                                        }`}
                                                    placeholder={labels[5] || "New password"}
                                                    aria-label="newPassword"
                                                    name="newPassword"
                                                    value={formData.newPassword}
                                                    onChange={handleChange}
                                                />  {formData.newPassword && (<span
                                                    onClick={toggleNewPasswordVisibility}
                                                    style={{
                                                        position: "absolute",
                                                        right: "25px",
                                                        top: "20px",
                                                        transform: "translateY(-50%)",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {showNewPassword ? "👁️" : "👁️‍🗨️"}
                                                </span>)}
                                                {errors.newPassword && (
                                                    <div className="invalid-feedback">
                                                        {errors.newPassword}
                                                    </div>
                                                )}
                                            </div></div>
                                        <div className="form-group">
                                            <label>{labels[6] || "Confirm Password"}</label> <div style={{ position: "relative" }}>
                                                <input autoComplete='off'
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className={`form-control form-password ${errors.confirmPassword ? "is-invalid" : ""
                                                        }`}
                                                    placeholder={labels[6] || "Confirm password"}
                                                    aria-label="confirmPassword"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                /> {formData.confirmPassword && (<span
                                                    onClick={toggleConfirmPasswordVisibility}
                                                    style={{
                                                        position: "absolute",
                                                        right: "25px",
                                                        top: "20px",
                                                        transform: "translateY(-50%)",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                                                </span>)}
                                                {errors.confirmPassword && (
                                                    <div className="invalid-feedback">
                                                        {errors.confirmPassword}
                                                    </div>
                                                )}</div>
                                        </div>
                                        <button disabled={loading}
                                            type="submit" style={{ width: "100%" }}
                                            className="btn btn-primary mr-2"
                                        > {loading ? (
                                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                              <img
                                                src="./loader.gif"
                                                alt="PLease wait..."
                                                style={{ width: "20px", height: "20px" }}
                                              />
                                            Please Wait...
                                            </span>
                                          ) :    labels[1] || "Change Password"}
                                            
                                        </button>
                                        {errors.global && (
                                            <p style={{ color: "red" }}>{errors.global}</p>
                                        )}

                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className='col-md-4'></div>
                    </div>
                </div>
            </div>

            <div
  className="floating-back-button"
  onClick={() => window.history.back()}
>
  ← Back
</div>

        </Base>
    )
}
