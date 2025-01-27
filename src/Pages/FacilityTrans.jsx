import React, { useEffect, useState } from "react";
import Base from "../Components/Base";

import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import HeadingData from "../Components/HeadingData";


export default function FacilityTrans() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false); // Loading state
  const serializedObject = location.state?.object;
  const myObject = JSON.parse(serializedObject);
  const [searchText, setSearchText] = useState("");
  const [errors, setErrors] = useState({});
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState({});

  useEffect(() => {
    const fetchLabel = async () => {
      try {
        const labelResponse = await axios.get(
          `sukrtya/api/language-labels/getLabels?formId=3&regLId=${localStorage.getItem("language")}`
        );
        setLabels(labelResponse.data[0]); // Assuming response is an array with labels as key-value pairs
      } catch (error) {
        console.error("Error fetching labels:", error);
      }
    };
    fetchLabel();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken"); // Retrieve token from localStorage

    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // console.log("Fetching data with the following parameters:", {
        //   facilityTypeId: myObject.facilityTypeId,
        //   facilityId: myObject.facilityId,
        //   language: localStorage.getItem("language"),
        // });

        const response = await axios.get(
          `/sukrtya/api/forms?facilytyType=${myObject.facilityTypeId}&FacilityId=${myObject.facilityId}&RgLId=${localStorage.getItem("language")}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        //console.log("API response:", response.data);
        setData(response.data);
      } catch (error) {
        console.error("Error occurred:", error.toJSON ? error.toJSON() : error);

        if (error.response) {
          // HTTP response received but indicates an error
          if (error.response.status === 401) {
            alert("Session expired. Please log in again.");
            localStorage.removeItem("authToken");
            navigate("/login");
          } else {
            setErrors({
              global:
                error.response.data?.message || "An unexpected error occurred.Please login again after logout.An unexpected error occurred.",
            });
          }
        } else if (error.request) {
          // No response received (e.g., network error)
          alert(
            "Network error: Unable to reach the server. Please check your connection or try again later."
          );
        } else {
          // Other errors (e.g., invalid Axios configuration)
          alert(`An error occurred: ${error.message}`);
        }
      }
    };

    fetchData();
  }, [myObject.facilityTypeId, myObject.facilityId, navigate]);// Added 'navigate'


  const handleSubmit = (formId, transActionId, user, approvalStatus, lat, lon, gaddress) => {

    setLoading(true); // Start loading
    navigate("/entry-form", {
      state: {
        formId: formId,
        transActionId: transActionId,
        RegLId: localStorage.getItem("language"),
        user: user, approvalStatus: approvalStatus, lat: lat, lon: lon, gaddress,
        object: serializedObject,

      },
    });
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
    <Base title="Facility Trans">
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

              <div className="col-md-6 col-sm-12 col-xs-12 col-lg-6 col-xl-6">
                <div className="mobile-display">
                  <div className="font-weight-bold text-capitalize">
                    {labels[14] || "Welcome"},
                    <span className="text-success">
                      {localStorage.getItem("profileName")}
                    </span> <br/> <small className="text-muted">
                      {localStorage.getItem("username")}
                    </small>
                  </div>

                </div>
                <HeadingData heading={myObject} /></div><div className="col-md-2"></div>
              <div className="col-md-4 col-sm-12 col-xs-12 col-lg-4 col-xl-4 text-right ">
                <div className="mobile-hidden">
                  <h3 className="font-weight-bold text-capitalize">
                    {labels[14] || "Welcome"},
                    <span className="text-success">
                      {localStorage.getItem("profileName").split(" ")[0]}
                    </span>
                  </h3>
                  <h6 className="font-weight-normal mb-0 ">
                    <span className="text-primary">
                      {localStorage.getItem("username")}
                    </span>
                  </h6>
                </div>
                <div className="input-group mt-4">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-primary text-white">
                      <i className="icon-search"></i>
                    </span>
                  </div>
                  <input
                    type="text"
                    className="form-control" value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="type here to search.."
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



            {data && data.length > 0 ? (
              <div className="row mt-4">

                {filteredData.map((item, index) => (

                  <div className="col-md-4 grid-margin " key={index}>


                    {!!item.transactionId ? (

                      (item.approvalStatus === 2) ? (
                        <div className="card " style={{ backgroundColor: "#5DAE8B" }}  >
                          <div className="card-header">
                            {labels[7] || "Survey Name"}    :  <strong >  {item.fromName}</strong>
                          </div>
                          <div className="card-body" style={{ color: "black" }}>
                            <p className="font-weight-500 ml-2">
                              {labels[8] || "User"} : {item.username}
                              <br />{labels[9] || "Transaction Id"}  : <strong> {item.transactionId}</strong>
                              <br />
                              {labels[10] || "Assessment Date"} : {item.userSubmissionDate}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                                <a className="text-right" href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`} rel="noreferrer" target="_blank">
                                  <img title="click here to view on google map" src="./location.png" alt="location" style={{ height: "30px" }} /> </a>
                                <small title="entry location" className="text-white" style={{ wordBreak: "break-word" }}>{item.gaddress}</small>
                              </div>
                            </div>
                            <p className="font-weight-500 text-right text-white">
                              Approved by <strong title={labels[15] || "Approved By"} style={{ color: "wheat" }} > {item.approvedBy} </strong> on <strong title={labels[16] || "Approved Date"} style={{ color: "wheat" }} >{item.approvedDate}</strong>


                            </p>

                          </div>
                          <div className="card-footer">
                            <button
                              style={{ width: "100%" }}
                              disabled={loading}
                              onClick={() =>
                                handleSubmit(
                                  item.formID,
                                  item.transactionId,
                                  item.user, item.approvalStatus,
                                  item.lat, item.lon, item.gaddress
                                )
                              }
                              className="btn btn-primary"
                            >
                              {loading ? "Please Wait..." : "View"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="card " style={{ backgroundColor: "#E3F0AF" }}  >
                          <div className="card-header">
                            {labels[7] || "Survey Name"}    :  <strong >  {item.fromName}</strong>
                          </div>
                          <div className="card-body" style={{ color: "black" }}>

                            <p className="font-weight-500 ml-2">
                              {labels[8] || "User"} : {item.username}
                              <br />{labels[9] || "Transaction Id"}  : <strong> {item.transactionId}</strong>
                              <br />
                              {labels[10] || "Created Date"} : {item.userSubmissionDate}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                                <a className="text-right" href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`} rel="noreferrer" target="_blank">
                                  <img title="click here to view on google map" src="./location.png" alt="location" style={{ height: "30px" }} /> </a>
                                <small title="entry location" className="text-muted" style={{ wordBreak: "break-word" }}>{item.gaddress}</small>
                              </div>
                            </div>

                            <h3 className="font-weight-500 mt-1 mb-0 text-center">
                              <strong className="text-danger">{labels[5] || "Approval Pending"}</strong>
                            </h3>


                          </div>
                          <div className="card-footer">
                            <button
                              style={{ width: "100%" }}
                              disabled={loading}
                              onClick={() =>
                                handleSubmit(
                                  item.formID,
                                  item.transactionId,
                                  item.user, item.approvalStatus,
                                  item.lat, item.lon, item.gaddress
                                )
                              }
                              className="btn btn-dark"
                            >
                              {loading ? "Please Wait..." : labels[12] || "Update"}
                            </button>
                          </div>
                        </div>
                      )

                    ) : (
                      <div className="card" style={{ backgroundColor: "#FF7676" }}  >
                        <div className="card-header">
                          {labels[7] || "Survey Name"}    :  <strong >  {item.fromName}</strong>
                        </div>
                        <div className="card-body" style={{ color: "black" }}>
                          <div className="text-center mt-3 mb-3">
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>

                              <img src="./pending.png" alt="pending" style={{ height: "100px" }} />
                              <span className="text-dark text-left"><strong>The survey assessment has not been completed by anyone at this time. Please take a moment to fill it out.</strong></span>
                            </div>
                          </div>
                        </div>
                        <div className="card-footer">
                          <button
                            style={{ width: "100%" }}
                            disabled={loading}
                            onClick={() =>
                              handleSubmit(
                                item.formID,
                                item.transactionId,
                                item.user, item.approvalStatus,
                                item.lat, item.lon, item.gaddress
                              )
                            }
                            className="btn btn-dark "
                          >
                            {loading ? "Please Wait..." : labels[13] || "Select"}
                          </button></div>
                      </div>
                    )}
                  </div>

                ))}
              </div>

            ) : (
              <div className="text-center">
                <br /> <br />
                <img alt="loading"
                  src="./images/loading.gif"
                  style={{ height: "100px" }}
                />
              </div>
            )}
          </div>

          {errors.global && (
            <p style={{ color: "red" }}>{errors.global}</p>
          )}
        </div>
      </div>
      <div
        className="floating-back-button"
        onClick={() => window.history.back()}
      >
        ← Back
      </div>

    </Base>
  );
}
