import React from "react";

export default function HeadingData(props) {
  //console.log(props.heading.facilityPhoto);
  return (
    <>
      <h5 className="mb-0 ">
        <img
          src={`https://aphcsukrtya.shsbihar.in/${props.heading.facilityPhoto}`}
          alt="image"
          style={{ height: "30px" }}
        />{" "}
        State :<span className="text-primary"> {props.heading.state}</span> ||
        District :<span className="text-primary">{props.heading.districtName} </span>{" "}
        || Block : <span className="text-primary">{props.heading.blockName}</span> ||
        Facility Name :{" "}
        <span className="text-primary"> {props.heading.facilityName}</span>
      </h5>
    </>
  );
}
