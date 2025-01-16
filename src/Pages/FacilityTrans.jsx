import React, { useEffect, useState } from "react";
import Base from "../Components/Base";

import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import HeadingData from "../Components/HeadingData";

export default function FacilityTrans() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false); // Loading state
  const serializedObject = location.state?.object;
  const myObject = JSON.parse(serializedObject);
  const [searchText, setSearchText] = useState("");

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
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `/sukrtya/api/forms?facilytyType=${myObject.facilityTypeId}&FacilityId=${myObject.facilityId}&RgLId=${localStorage.getItem("language")}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }

        );


        setData(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Token expired, redirect to login with message

          localStorage.clear();
          window.location.href = "/";

        } else {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [myObject.facilityTypeId, myObject.facilityId]);

  const handleSubmit = (formId, transActionId, user, approvalStatus, lat, lon, gaddress) => {

    setLoading(true); // Start loading
    navigate("/entry-form", {
      state: {
        formId: formId,
        transActionId: transActionId,
        RegLId: localStorage.getItem("language"),
        user: user, approvalStatus: approvalStatus, lat: lat, lon: lon, gaddress: gaddress,
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
            <div className="row">
              <div className="col-md-4">
                <h3 className="font-weight-bold text-capitalize">
                  {labels[14] || "Welcome"},
                  <span className="text-success">
                    {localStorage.getItem("profileName")}
                  </span>
                </h3>

                <h6 className="font-weight-normal mb-0 ">
                  <span className="text-primary">
                    {localStorage.getItem("username")}
                  </span>
                </h6>
              </div>
              <div className="col-md-4"></div>
              <div className="col-md-4 mt-4">
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-primary text-white">
                      <i className="icon-search"></i>
                    </span>
                  </div>
                  <input
                    type="text"
                    className="form-control"  value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={labels[1] || "type here to search.."}
                  />
                </div>
                <p className="text-right">  <small >
                {filteredData.length > 0
                  ? `Found ${filteredData.length} item(s)`
                  : "No items found"}
              </small></p>
              </div>
            </div>
            <div className="row">
              <div className="col-md-8 mt-4">
                <HeadingData heading={myObject} />
              </div>
            </div>
            {data && data.length > 0 ? (
              <div className="row mt-4">

                {filteredData.map((item, index) => (

                  <div className="col-md-4 grid-margin " key={index}>


                    {!!item.transactionId ? (

                      (item.approvalStatus == "2") ? (
                        <div className="card " style={{ backgroundColor: "#aec7af" }}  >
                          <div className="card-body" style={{ color: "black" }}>
                            <p className="font-weight-500">
                              {labels[7] || "Servey Name"}    : {item.fromName}
                              <br />
                              {labels[8] || "User"} : {item.username}

                              <br />{labels[9] || "Transaction Id"}  : <strong> {item.transactionId}</strong>
                              <br />
                              {labels[10] || "Created Date"} : {item.userSubmissionDate}
                              <br />

                             {labels[15] || "Approved By"} : {item.approvedBy}
                              <br />
                             {labels[16] || "Approved Date"} :{item.approvedDate}
                              <br />
                            </p>
                            <div className="text-left">
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
                                className="btn btn-primary btn-sm"
                              >
                                {loading ? "Please Wait..." : labels[12] || "Update"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="card " style={{ backgroundColor: "#dcf27d" }}  >
                          <div className="card-body" style={{ color: "black" }}>
                            <p className="font-weight-500">
                              {labels[7] || "Servey Name"}    : {item.fromName}
                              <br />
                              {labels[8] || "User"} : {item.username}

                              <br />{labels[9] || "Transaction Id"}  : <strong> {item.transactionId}</strong>
                              <br />
                              {labels[10] || "Created Date"} : {item.userSubmissionDate}

                              <br /><br />
                              <strong className="text-danger">{labels[5] || "Approval Pending"}</strong>
                            </p>
                            <div className="text-left">
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
                                className="btn btn-primary btn-sm"
                              >
                                {loading ? "Please Wait..." : labels[12] || "Update"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )

                    ) : (
                      <div className="card" style={{ backgroundColor: "#e5a0a0" }}  >
                        <div className="card-body" style={{ color: "black" }}>
                          <p className="font-weight-500">
                            {labels[7] || "Servey Name"}: {item.fromName}
                            <br /> 
                            {/* {labels[8] || "User"} : {item.username} */}
                            <br />   <br />
                            <span className="text-white"><strong>{labels[4] || "Not filled by any one !!"} </strong></span>   <br />   <br /> <br />
                          </p>

                          <div className="text-left">
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
                              className="btn btn-primary btn-sm"
                            >
                              {loading ? "Please Wait..." : labels[13] || "Select"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                ))}
              </div>

            ) : (
              <div className="text-center">
                <br /> <br />
                <img
                  src="./images/loading.gif"
                  style={{ height: "100px" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Base>
  );
}
