import React, { useState, useEffect } from "react";
import axios from "axios";

const ReverseGeocodeOlaMap = ({ latitude, longitude }) => {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiKey = "L5LgFvW3Tl2opppoJA0XHChNTPlgKKiDb76reivs"; // Replace with your actual API key
  useEffect(() => {
    const fetchAddress = async () => {
      setLoading(true);
      setError(null); // Reset error state before fetching

      try {
        const response = await axios.get(
          `https://api.olamaps.io/places/v1/reverse-geocode`,
          {
            params: {
              latlng: `${latitude},${longitude}`,
              api_key: apiKey,
            },
          }
        );

        if (response.data && response.data.results) {
          // Assuming the API response has a results array
          const formattedAddress =
            response.data.results[0]?.formatted_address || "Address not found";
          setAddress(formattedAddress);
        } else {
          setAddress("Address not found");
        }
      } catch (err) {
        setError("Failed to fetch address");
      } finally {
        setLoading(false);
      }
    };

    if (latitude && longitude) {
      fetchAddress();
    }
  }, [latitude, longitude, apiKey]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <>
     <p>{address}</p>
    </>
  );
};

export default ReverseGeocodeOlaMap;
