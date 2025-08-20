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
  const [designation, setDesignation] = useState({});

  useEffect(() => {
    const fetchLabel = async () => {
      try {
        const labelResponse = await axios.get(
          `/sukrtya/api/language-labels/getLabels?formId=3&regLId=${localStorage.getItem("language")}`
        );
        //console.log("labelResponse : "+labelResponse)
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
        const designation = await axios.get(
          `/sukrtya/api/mapped-facility-users?facilityId=${myObject.facilityId}&regLId=${localStorage.getItem("language")}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
       // console.log("designation : "+designation)
        setDesignation(designation.data);
        const response = await axios.get(
          `/sukrtya/api/forms?facilytyType=${myObject.facilityTypeId}&FacilityId=${myObject.facilityId}&RgLId=${localStorage.getItem("language")}&AssessmentId=${localStorage.getItem("assessmentID")}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        //console.log("API response:", response.data);
        setData(response.data);
        localStorage.setItem("formID", response.data[0]?.formID || "");  // Store formID in localStorage for later use
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
                   User : 
                    <span className="text-success">
                      {localStorage.getItem("profileName")}
                    </span> <br /> <small className="text-muted">
                      {localStorage.getItem("username")}
                    </small>
                  </div>

                </div>
                <HeadingData heading={myObject} /></div><div className="col-md-2"></div>
              <div className="col-md-4 col-sm-12 col-xs-12 col-lg-4 col-xl-4 text-right ">
                <div className="mobile-hidden">
                  <h3 className="font-weight-bold text-capitalize">
                    
                    <span className="text-success">
                      {localStorage.getItem("profileName")}
                    </span>
                  </h3>
                  <h6 className="font-weight-normal mb-0 ">
                    <span className="text-muted">Username : &nbsp;</span>
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



            {data && data.length > 0 ? (<>
             
               
                  <div className="row mt-4">
                    <div className="col-md-4 grid-margin">
                      <div className="card h-80" style={{ backgroundColor: "#B4E4FF" }}>
                        <div className="card-header">
                          <strong>Add New Survey</strong>
                        </div>
                        <div className="card-body" style={{ color: "black", minHeight: "150px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div className="text-center">
                            <i className="icon-plus" style={{ fontSize: "40px", marginBottom: "15px" }}></i>
                            <div>
                              <strong>Click here to start a new survey assessment</strong>
                            </div>
                          </div>
                        </div>
                        <div className="card-footer">
                          <button
                            style={{ width: "100%" }}
                            disabled={loading}
                            onClick={() =>
                              handleSubmit(
                                localStorage.getItem("formID"),
                                myObject.RegLId,
                                myObject.user,
                                null,
                                null,
                                null,
                                null
                              )
                            }
                            className="btn btn-dark"
                          >
                            {loading ? "Please Wait..." : "Add New"}
                          </button>
                        </div>
                      </div>
                    </div>
                    {filteredData.map((item, index) => (
                      <div className="col-md-4 grid-margin " key={index}>


                        {!!item.transactionId ? (

                         
                            <div className="card h-80" style={{ backgroundColor: "#E3F0AF" }}  >
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
                                    <small title="entry location" className="text-muted" style={{ wordBreak: "break-word" }}>click here to view on google map</small>
                                  </div>
                                </div>
{/* 
                                <h3 className="font-weight-500 mt-1 mb-0 text-center">
                                  <strong className="text-danger">{labels[5] || "Approval Pending"}</strong>
                                </h3> */}


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
                                  {loading ? "Please Wait..." : "View"}
                                </button>
                              </div>
                            </div>
                     

                        ) : (
                         <> </>
                        )}
                      </div>

                    ))}
                  </div>
               
                <div className="row">
                  <div className="card">
                    {designation.map((item, index) => (
                      <div className="card-body shadow" key={index}>
                        <div className="row">
                          <div className="col-4"><span className="text-primary">   {item.isGovt ? <img alt="govt" src="./govt.jpg" className="img-thumbnail" style={{ height: "100px", width: "150px" }} /> : <img alt="ngo" src="./ngo.webp" className="img-thumbnail p-4" style={{ height: "100px", width: "150px" }} />}</span></div>
                          <div className="col-8">
                            <div ><strong className="text-uppercase"> {item.profile}</strong><br />
                              {item.userType}
                              <br />{item.profileMobile}

                            </div>
                          </div>
                        </div>


                      </div>))}
                  </div>
                </div>

              
</>
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
