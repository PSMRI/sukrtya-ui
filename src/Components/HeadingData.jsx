import axios from "axios";
import  { useEffect, useState } from "react";

export default function HeadingData(props) {
  const [labels, setLabels] = useState({});
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
          <span className="text-secondary">{labels[6] || "State"}:</span> {toTitleCase(props.heading.state)}
          <span className="text-secondary"> || {labels[7] || "District"} :</span>
          {toTitleCase(props.heading.districtName)}
          <span className="text-secondary"> || {labels[8] || "Block"} :</span>
          {toTitleCase(props.heading.blockName)}
          <span className="text-secondary"> || {labels[5] || "Facility Name"}: </span>
          {toTitleCase(props.heading.facilityName)}
        </span></td>
      </tr>
       </tbody>
    </table>
   
    </>
  );
}
