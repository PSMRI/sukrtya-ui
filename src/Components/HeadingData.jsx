import React from "react";

export default function HeadingData(props) {
  function toTitleCase(str) {
    if (!str) { 
        // Check if str is null, undefined, or an empty string
        return '';
    }
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}
  return (
    <>
 
    <table>
    <tbody>
      <tr>
        <td> <img
          src={`https://aphcsukrtya.shsbihar.in/${props.heading.facilityPhoto}`}
          alt="image"  
          style={{ height: "50px" }}
        /></td>
        <td> <span>
          <span className="text-secondary">State :</span> {toTitleCase(props.heading.state)}
          <span className="text-secondary">|| District :</span>
          {toTitleCase(props.heading.districtName)}
          <span className="text-secondary">|| Block :</span>
          {toTitleCase(props.heading.blockName)}
          <span className="text-secondary">|| Facility Name : </span>
          {toTitleCase(props.heading.facilityName)}
        </span></td>
      </tr>
       </tbody>
    </table>
   
    </>
  );
}
