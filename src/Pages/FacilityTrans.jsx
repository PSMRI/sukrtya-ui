import React, { useEffect, useState } from "react";
import Base from "../Components/Base";

import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import HeadingData from "../Components/HeadingData";

export default function FacilityTrans() {
  const navigate = useNavigate();
  const location = useLocation();
  const serializedObject = location.state?.object;
  const myObject = JSON.parse(serializedObject);
  

  const date = new Date();
  const formattedDate = date
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, " ");

  const [data, setData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://115.245.54.211:9090/api/GetFormTransactionList?facilytyType=${myObject.facilityTypeId}&FacilityId=${myObject.facilityId}&RgLId=1`
        );
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [myObject.facilityTypeId, myObject.facilityId]);

  const handleSubmit = (formId, transActionId) => {
    navigate("/entry-form", {
      state: { formId: formId, transActionId: transActionId, RegLId: 1 },
    });
  };

  return (
    <Base title="Facility Trans">
      <div className="container-fluid page-body-wrapper">
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold text-capitalize">
                      Welcome,{" "}
                      <span className="text-success">
                        {localStorage.getItem("profileName")}
                      </span>
                    </h3>

                    <h6 className="font-weight-normal mb-0">
                      <span className="text-primary">
                        {localStorage.getItem("username")}
                      </span>
                    </h6>
                  </div>
                  <div className="col-12 col-xl-4">
                    <div className="justify-content-end d-flex">
                      <div className="dropdown flex-md-grow-1 flex-xl-grow-0">
                        <a
                          className="btn btn-sm btn-light bg-white  "
                          type="button"
                          id="dropdownMenuDate2"
                        >
                          Today ({formattedDate})
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-8 mt-4">
                <HeadingData heading={myObject} />
              </div>
              <div className="col-md-4 mt-4">
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-primary text-white">
                      <i className="icon-search"></i>{" "}
                    </span>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="type here to search.."
                  />
                </div>
              </div>
            </div>
            {data && data.length > 0 ? (
              <div className="row mt-4">
                <div className="col-md-6 grid-margin stretch-card">
                  {data.map((item, index) => (
                    <div className="card" key={index}>
                      <div className="card-body">
                        <p className="font-weight-500">
                          Transaction Id :{" "}
                          <span className="text-success">
                            {item.transactionId}
                          </span>
                          <br />
                          Created Date : {item.userSubmissionDate}
                          <br />
                          Facility Name : {item.fromName}
                          <br />
                          User : {localStorage.getItem("profileName")}
                          <br />
                          Last Action Date : {item.userSubmissionDate}
                          <br />
                          {/* Current Status :{" "}
                          <strong className="text-warning">
                            Approval Pending
                          </strong> */}
                        </p>
                        <div className="text-left">
                          <button
                            onClick={() =>
                              handleSubmit(item.formID, item.transactionId)
                            }
                            className="btn btn-primary btn-sm"
                          >
                            {" "}
                            Select{" "}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>Loading data...</p> // Or display a placeholder message
            )}
          </div>
        </div>
      </div>
    </Base>
  );
}
