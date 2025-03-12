import axios from "axios";
import { useEffect, useState } from "react";

  const LocationHandler = ({ lat, lon, gaddress, labels }) => {
    const [locationData, setLocationData] = useState({
      latitude: lat,
      longitude: lon,
      address: gaddress || "Fetching address...",
    });
  
    useEffect(() => {
      if (lat && lon && !gaddress) {
        const fetchAddress = async () => {
          try {
            const response = await axios.get("https://api.olamaps.io/places/v1/reverse-geocode", {
              params: {
                latlng: `${lat},${lon}`,
                api_key: "L5LgFvW3Tl2opppoJA0XHChNTPlgKKiDb76reivs",
              },
            });
            setLocationData((prev) => ({ ...prev, address: response.data.results[0]?.formatted_address || "Address not found" }));
          } catch (error) {
            console.error("Failed to fetch address:", error);
          }
        };
        fetchAddress();
      }
    }, [lat, lon, gaddress]);
  
    return (
      <div>
        <p>
          Latitude: {locationData.latitude}, Longitude: {locationData.longitude}
          <br />
          Address: {locationData.address}
        </p>
      </div>
    );
  };

  export default LocationHandler;