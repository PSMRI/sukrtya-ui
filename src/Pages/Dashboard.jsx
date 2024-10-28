import React, { useState } from "react";
import FaciltyList from "../Data/1.GetFaciltyList.json";
import FormTranslList from "../Data/2.GetFormTranslList.json";
import { Navigate } from "react-router";
import { Link } from "react-router-dom";
import Base from "../Components/Base";
export default function Dashboard() {
  const userName =
    FormTranslList.objform[0]?.User ||
    FormTranslList.objPrivateUsers[0]?.profileName;
  const profileEmail = FormTranslList.objPrivateUsers[0]?.profileEmail;

  const date = new Date();
  const formattedDate = date
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, " ");



    
  return (
    <>
      
        
      <Base title="Dashboard">
        <div className="container-fluid page-body-wrapper">
          <div className="main-panel">
            <div className="content-wrapper">
              <div className="row">
                <div className="col-md-12 grid-margin">
                  <div className="row">
                    <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                      <h3 className="font-weight-bold text-capitalize">Welcome {userName}</h3>

                      <h6 className="font-weight-normal mb-0">
                        <span className="text-primary">{profileEmail}</span>
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
                <div className="col-md-6 grid-margin stretch-card">
                  <div className="card tale-bg">
                    <div className="card-people mt-auto">
                      <img src="images/dashboard/people.svg" alt="people" />
                      <div className="weather-info">
                        <div className="d-flex">
                          <div>
                            <h2 className="mb-0 font-weight-normal">
                              <i className="icon-sun mr-2"></i>31<sup>C</sup>
                            </h2>
                          </div>
                          <div className="ml-2">
                            <h4 className="location font-weight-normal">
                              Patna, Bihar
                            </h4>
                            <h6 className="font-weight-normal">India</h6>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 grid-margin transparent">
                  <div className="row">
                    <div className="col-md-6 mb-4 stretch-card transparent">
                      <div className="card card-tale">
                        <div className="card-body">
                          <p className="mb-4">Survey </p>
                          <p className="fs-30 mb-2">00</p>
                          <p>total</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-4 stretch-card transparent">
                      <div className="card card-dark-blue">
                        <div className="card-body">
                          <p className="mb-4">Assessment</p>
                          <p className="fs-30 mb-2">00</p>
                          <p>total</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-4 mb-lg-0 stretch-card transparent">
                      <div className="card card-light-blue">
                        <div className="card-body">
                          <p className="mb-4">Active Assessment</p>
                          <p className="fs-30 mb-2">00</p>
                          <p>total</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 stretch-card transparent">
                      <div className="card card-light-danger">
                        <div className="card-body">
                          <p className="mb-4">Pending Assessment</p>
                          <p className="fs-30 mb-2">00</p>
                          <p>total</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12 grid-margin stretch-card">
                  <div className="card">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4">
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
                      <div className="row">
                        <div className="col-12">
                          <div className="table-responsive">
                            <table className="table table-striped">
                              <thead>
                                <tr>
                                  <th>Photo</th>
                                  <th>State</th>
                                  <th>District</th>
                                  <th>Block</th>
                                  <th>Facility Type</th>
                                  <th>Facility Name</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {FaciltyList.map((getFaciltyList, index) => (
                                  <tr key={index}>
                                    <td>
                                      <img
                                        src={`https://aphcsukrtya.shsbihar.in/${getFaciltyList.facilityPhoto}`}
                                        alt="image"
                                      />
                                    </td>
                                    <td>{getFaciltyList.FacilityState}</td>
                                    <td>{getFaciltyList.FacilityDistrict}</td>
                                    <td>{getFaciltyList.FacilityBlock}</td>

                                    <td>{getFaciltyList.facilityTypeNameEN}</td>
                                    <td>{getFaciltyList.facilityNameEN}</td>
                                    <td>
                                      <Link to={"/facility-trans"}>
                                        <button
                                          type="submit"
                                          className="btn btn-primary btn-sm"
                                        >
                                          Select
                                        </button>
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

           
          </div>
        </div>
    </Base>
    </>
  );
}
