import React, { useEffect, useState } from "react";
import Base from "../Components/Base";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function FacilityTrans() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [ashaStaff, setAshaStaff] = useState([]);
  const [otherStaff, setOtherStaff] = useState([]);
  const [masterContext, setMasterContext] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const fetchMasterContext = async () => {
      try {
        const response = await axios.get("/api/me/master-context", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMasterContext(response.data);

        // Extract all staff from all facilities
        let ashaList = [];
        let otherList = [];

        if (response.data.facilities && response.data.facilities.length > 0) {
          response.data.facilities.forEach((facility) => {
            if (facility.staff && facility.staff.length > 0) {
              facility.staff.forEach((staff) => {
                if (staff.role === "ASHA") {
                  ashaList.push(staff);
                } else {
                  otherList.push(staff);
                }
              });
            }
          });
        }

        setAshaStaff(ashaList);
        setOtherStaff(otherList);
        setLoading(false);
      } catch (error) {
        console.error("Error occurred:", error);

        if (error.response?.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("authToken");
          navigate("/login");
        } else {
          setErrors({
            global:
              error.response?.data?.message ||
              "An error occurred while fetching data.",
          });
        }
        setLoading(false);
      }
    };

    fetchMasterContext();
  }, [navigate]);
  return (
    <Base title="Staff Directory">
      <div className="container-fluid page-body-wrapper">
        <div className="main-panel">
          <div className="content-wrapper">
            {/* Header Section */}
            <div
              className="row"
              style={{
                display: "flex",
                alignItems: "center",
                fontFamily: "Arial, sans-serif",
                padding: "20px",
                backgroundColor: "#f0f0f0",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <div className="col-md-12">
                <h2 className="font-weight-bold text-capitalize">
                  {masterContext?.displayName
                    ? `Welcome, ${masterContext.displayName}`
                    : "Staff Directory"}
                </h2>
                <p className="text-muted">
                  {masterContext?.facilities?.[0]?.facility?.name || "Facility"}
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center" style={{ padding: "50px" }}>
                <img
                  alt="loading"
                  src="./images/loading.gif"
                  style={{ height: "100px" }}
                />
                <p className="mt-3">Loading staff information...</p>
              </div>
            ) : (
              <div className="row">
                {/* Left Side - ASHA Staff */}
                <div className="col-md-6 col-sm-12">
                  <div className="card h-100">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0 font-weight-bold">
                        ASHA Staff ({ashaStaff.length})
                      </h5>
                    </div>
                    <div className="card-body p-0">
                      {ashaStaff.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Name</th>
                                <th>Mobile</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ashaStaff.map((staff, index) => (
                                <tr key={index}>
                                  <td>
                                    <strong>
                                      {staff.healthWorker?.fullName || "N/A"}
                                    </strong>
                                  </td>
                                  <td>
                                    {staff.healthWorker?.mobilePhone || "N/A"}
                                  </td>
                                  <td>
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor:
                                          staff.status === "ACTIVE"
                                            ? "#28a745"
                                            : "#dc3545",
                                        color: "white",
                                        padding: "5px 10px",
                                      }}
                                    >
                                      {staff.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ padding: "20px", textAlign: "center" }}>
                          <p className="text-muted">No ASHA staff found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Other Staff */}
                <div className="col-md-6 col-sm-12">
                  <div className="card h-100">
                    <div className="card-header bg-success text-white">
                      <h5 className="mb-0 font-weight-bold">
                        Other Staff ({otherStaff.length})
                      </h5>
                    </div>
                    <div className="card-body p-0">
                      {otherStaff.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Role</th>
                                <th>Name</th>
                                <th>Mobile</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {otherStaff.map((staff, index) => (
                                <tr key={index}>
                                  <td>
                                    <span
                                      style={{
                                        backgroundColor: "#007bff",
                                        color: "white",
                                        padding: "3px 8px",
                                        borderRadius: "3px",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {staff.role}
                                    </span>
                                  </td>
                                  <td>
                                    <strong>
                                      {staff.healthWorker?.fullName || "N/A"}
                                    </strong>
                                  </td>
                                  <td>
                                    {staff.healthWorker?.mobilePhone || "N/A"}
                                  </td>
                                  <td>
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor:
                                          staff.status === "ACTIVE"
                                            ? "#28a745"
                                            : "#dc3545",
                                        color: "white",
                                        padding: "5px 10px",
                                      }}
                                    >
                                      {staff.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ padding: "20px", textAlign: "center" }}>
                          <p className="text-muted">No other staff found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {errors.global && (
              <div
                className="alert alert-danger mt-3"
                role="alert"
              >
                {errors.global}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div
        className="floating-back-button"
        onClick={() => window.history.back()}
      >
        ← Back
      </div>
    </Base>
  );
}
