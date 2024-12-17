import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Base from "../Components/Base";
import axios from "axios";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, regLid, mappingUserId } = location.state;
  const [loading, setLoading] = useState(false); // Loading state


  const [data, setData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken"); // Retrieve token from localStorage

        const response = await axios.get(
          `/sukrtya/api/facilities?UserId=${userId}&RegLid=${regLid}&MappingUserId=${mappingUserId}`,
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
          alert("Session expired. Please log in again.");
          localStorage.clear();
          window.location.href = "/";

        } else {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [userId, regLid, mappingUserId]);

  const handleSubmit = (item) => {
    setLoading(true); // Start loading
    const serializedObject = JSON.stringify(item);
    navigate("/facility-trans", { state: { object: serializedObject } });
    setLoading(false);
  };
  return (
    <>
      <Base title="Dashboard">
        <div className="container-fluid page-body-wrapper">
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="row">
                <div className="col-md-4">
                  <h3 className="font-weight-bold text-capitalize">
                    Welcome,
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
                      className="form-control"
                      placeholder="type here to search.."
                    />
                  </div>
                </div>
              </div>

              <div className="row mt-5">
                {data.map((item, index) => (
                  <div className="col-md-4 mb-4" key={index}>
                    <div className="card tale-bg">
                      <nav className="navbar">
                        <img
                          className="img-thumbnail"
                          src={`https://aphcsukrtya.shsbihar.in/${item.facilityPhoto}`}
                          alt="image"
                          style={{ height: "70px", width: "70px" }}
                        />
                        <div style={{ textAlign: "right" }}>
                          Facility Name : <strong> {item.facilityName}</strong>
                          <br />
                          <small>NIN No. : {item.facilityNin}</small>
                        </div>
                      </nav>
                      <div style={{ padding: "20px" }}>
                        <table>
                          <tbody>
                            <tr>
                              <td>State</td>
                              <td style={{ width: "20px" }}>:</td>
                              <td>
                                <strong>{item.state}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td>District</td>
                              <td style={{ width: "20px" }}>:</td>
                              <td>
                                <strong>{item.districtName}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td>Block</td>
                              <td style={{ width: "20px" }}>:</td>
                              <td>
                                <strong>{item.blockName}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td>Facility Type</td>
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
                          {loading ? "Please Wait..." : "Select"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Base>
    </>
  );
}
