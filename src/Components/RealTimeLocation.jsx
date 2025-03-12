import { useEffect, useState } from "react";
  const RealTimeLocation = () => {
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        setLoading(false);
        return;
      }
  
      const handleSuccess = (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      };
  
      const handleError = (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Permission denied. Please enable location access in your browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable. Ensure GPS is enabled.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Try again.");
            break;
          default:
            setError("An unknown error occurred while fetching location.");
        }
        setLoading(false);
      };
  
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError);
  
      const watcher = navigator.geolocation.watchPosition(handleSuccess, handleError);
  
      return () => navigator.geolocation.clearWatch(watcher);
    }, []);
  
    return (
      <div className="real-time-location">
        {loading ? (
          <p>Fetching location...</p>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : (
          <p>
            Real-time Location: Latitude {location.latitude}, Longitude {location.longitude}
          </p>
        )}
      </div>
    );
  };
  

  export default RealTimeLocation;