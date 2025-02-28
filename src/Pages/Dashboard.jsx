import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Base from "../Components/Base";
import axios from "axios";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, regLid, mappingUserId } = location.state;
  const [loading, setLoading] = useState(false); // Loading state

  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState({});
  const [errors, setErrors] = useState({});
  useEffect(() => {
    const fetchLabel = async () => {
      try {
        const labelResponse = await axios.get(
          `sukrtya/api/language-labels/getLabels?formId=2&regLId=${localStorage.getItem("language")}`
        );
        setLabels(labelResponse.data[0]); // Assuming response is an array with labels as key-value pairs
      } catch (error) {
        console.error("Error fetching labels:", error);
      }
    };
    
    fetchLabel();
   
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken"); // Retrieve token from localStorage

        const response = await axios.get(
          `/sukrtya/api/facilities?UserId=${userId}&RegLid=${localStorage.getItem("language")}&MappingUserId=${mappingUserId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setData(response.data);
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
      }
    };

    fetchData();
  }, [userId, regLid, mappingUserId, navigate]); // Added 'navigate'


  const handleSubmit = (item) => {
    setLoading(true); // Start loading
    const serializedObject = JSON.stringify(item);
    navigate("/facility-trans", { state: { object: serializedObject } });
    setLoading(false);
  };

  // Filter logic to match search text
  const filteredData = data.filter((item) =>
    Object.values(item).some(
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes(searchText.toLowerCase())
    )
  );
  return (
    <>
      <Base title="Dashboard">
        <div className="container-fluid page-body-wrapper">
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="row" style={{
                display: "flex",
                alignItems: "center",
                fontFamily: "Arial, sans-serif",
                padding: "20px",
                backgroundColor: "#f0f0f0",
                borderRadius: "8px",
              }}>
                <div className="col-md-4">
                  <h3 className="font-weight-bold text-capitalize">
                    {labels[4] || "Welcome"},
                    <span className="text-success">
                      {localStorage.getItem("profileName").split(" ")[0]}
                    </span>
                  </h3>

                  <h6 className="font-weight-normal mb-0 ">
                    <span className="text-primary">
                      {localStorage.getItem("username")}
                    </span>
                  </h6>
                </div><div className="col-md-4 mt-2"></ div>

                <div className="col-md-4 mt-2">
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text bg-primary text-white">
                        <i className="icon-search"></i>
                      </span>
                    </div>
                    <input
                      type="text"
                      className="form-control" value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder={labels[2] || "type here to search.."}
                    />
                  </div>
                  <p className="text-right">
                    <small>
                      {filteredData.length > 0 ? (
                        <span className="text-success">Found {filteredData.length} item(s)</span>
                      ) : (
                        <span className="text-danger">No items found</span>

                      )}
                    </small>
                  </p>

                </div>


              </div>
              <div className="row  mt-2">


              </div>
              <div className="row mt-2">

                {filteredData.map((item, index) => (
                  <div className="col-md-4 mb-4" key={index}>
                    <div className="card rounded" style={{ backgroundColor: "#FBF6E9" }}>
                      <nav className="navbar">
                        <img
                          className="img-responsive"
                          src={"/placeholder-image.png"}
                          alt={item.facilityPhoto}
                          style={{ height: "70px", width: "70px" }}
                        />
                        <div style={{ textAlign: "right" }}>
                          {labels[5] || "Facility Name"}  : <strong> {item.facilityName}</strong>
                          <br />
                          <small>NIN No. : {item.facilityNin}</small>
                        </div>
                      </nav>
                      <div style={{ padding: "20px" }}>
                        <table>
                          <tbody>
                            <tr>
                              <td>{labels[6] || "State"} </td>
                              <td style={{ width: "20px" }}>:</td>
                              <td>
                                <strong>{item.state}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td>{labels[7] || "District"}</td>
                              <td style={{ width: "20px" }}>:</td>
                              <td>
                                <strong>{item.districtName}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td>{labels[8] || "Block"}</td>
                              <td style={{ width: "20px" }}>:</td>
                              <td>
                                <strong>{item.blockName}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td>{labels[9] || "Facility Name"}</td>
                              <td style={{ width: "20px" }}>:</td>
                              <td>
                                <strong>{item.facilityTypeCode}</strong>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="card-footer">
                        <button
                          style={{ width: "100%" }}
                          disabled={loading}
                          onClick={() => handleSubmit(item)}
                          className="btn btn-primary mr-2"
                        >
                          {loading ? "Please Wait..." : labels[3] || "Select"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.global && (
                <p style={{ color: "red" }}>{errors.global}</p>
              )}
            </div>
          </div>
        </div>
      </Base>
    </>
  );
}
