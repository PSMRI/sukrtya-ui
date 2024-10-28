import React from "react";
import Base from "../Components/Base";
import FormTranslList from "../Data/2.GetFormTranslList.json";
import FaciltyList from "../Data/1.GetFaciltyList.json";
import { Link } from "react-router-dom";
export default function FacilityTrans() {
  const date = new Date();
  const formattedDate = date
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, " ");

  const userName =
    FormTranslList.objform[0]?.User ||
    FormTranslList.objPrivateUsers[0]?.profileName;
  const profileEmail = FormTranslList.objPrivateUsers[0]?.profileEmail;
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
                      Welcome {userName}
                    </h3>

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
              <div className="col-md-8 mt-4">
                <h5 class="mb-0 text-primary">
                  <img
                    src="https://aphcsukrtya.shsbihar.in/facilityicon.png"
                    alt="image"
                    style={{ height: "30px" }}
                  />{" "}
                  State : BIHAR || District : KATIHAR || Block : KADWA ||
                  Facility Name : APHC MAHINAGAR
                </h5>
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
            <div className="row mt-4">
              <div className="col-md-6 grid-margin stretch-card">
                <div className="card">
                  <div className="card-body">
                    <p className="font-weight-500">
                      Transaction Id :{" "}
                      {FormTranslList.objform[0]?.TransactionId}
                      <br />
                      Created Date : {FormTranslList.objform[0]?.CreateDate}
                      <br />
                      Facility Name : {FormTranslList.objform[0]?.fromName}
                      <br />
                      User : {FormTranslList.objform[0]?.User}
                      <br />
                      Last Action Date : {FormTranslList.objform[0]?.CreateDate}
                      <br />
                      Current Status :{" "}
                      <strong className="text-warning">Approval Pending</strong>
                    </p>
                    <div className="text-right">
                      <Link to={"/entry-form"}>
                        <button type="button" class="btn btn-primary btn-sm">
                          Select
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Base>
  );
}
