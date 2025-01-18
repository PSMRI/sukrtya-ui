import axios from "axios";
import { useEffect, useState } from "react";

export default function HeadingData(props) {
  const logoStyle = {
    width: "100px",
    height: "100px",
    marginRight: "20px",
    objectFit: "cover", // Ensures the image fits nicely
    borderRadius: "50%", // Optional: Makes the image circular
  };

  const containerStyle = {
    display: "flex",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    backgroundColor: "#f0f0f0",
    borderRadius: "8px",
  };

  const headingStyle = {
    display: "flex",
    flexDirection: "column",
  };

  const detailStyle = {
    fontSize: "16px",
    marginBottom: "5px",
  };

  const [labels, setLabels] = useState({});
  const [imageLoaded, setImageLoaded] = useState(false); // Track image loading state

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

  const toTitleCase = (str) => {
    if (!str) {
      return "";
    }
    return str.replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase());
  };

  return (
    <>
      <div style={containerStyle}>
        <img
          src={
            imageLoaded
              ? `https://aphcsukrtya.shsbihar.in/${props.heading.facilityPhoto}`
              : "/placeholder-image.png" // Replace with your placeholder image path
          }
          alt="Facility"
          style={logoStyle}
          onLoad={() => setImageLoaded(true)} // When the image successfully loads
          onError={() => setImageLoaded(false)} // Fallback to placeholder if image fails to load
        />
        <div style={headingStyle}>
          <div style={detailStyle}>
            {labels[6] || "State"}: {toTitleCase(props.heading.state)}
          </div>
          <div style={detailStyle}>
            {labels[7] || "District"}: {toTitleCase(props.heading.districtName)}
          </div>
          <div style={detailStyle}>
            {labels[8] || "Block"}: {toTitleCase(props.heading.blockName)}
          </div>
          <div style={detailStyle}>
            {labels[5] || "Facility Name"}: {toTitleCase(props.heading.facilityName)}
          </div>
        </div>
      </div>
    </>
  );
}
