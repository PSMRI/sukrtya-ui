import React, { useEffect, useRef, useState } from "react";
import Base from "../Components/Base";
import imageCompression from "browser-image-compression";

import axios from "axios";
import { useLocation, useNavigate } from "react-router";
import Webcam from "react-webcam";
import HeadingData from "../Components/HeadingData";
export default function EntryForm() {
  const [loading, setLoading] = useState(false); // Loading state
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const inputRefs = useRef({}); // Use refs for inputs
  const navigate = useNavigate();

  const location = useLocation();
  const { formId, transActionId, RegLId, user } = location.state;
  const serializedObject = location.state?.object;
  const myObject = JSON.parse(serializedObject);
  const [facingMode, setFacingMode] = useState("user"); // Default to front camera
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState("");
  const [error, setError] = useState(null);
  const [hiddenQuestions, setHiddenQuestions] = useState(new Set());
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [imageSize, setImageSize] = useState(null);

  const [labels, setLabels] = useState({});


  useEffect(() => {
    if (!navigator.geolocation) {
      setError(labels[24] || "Geolocation is not supported by your browser.");
      return;
    }

    const handleLocationPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });
        if (permissionStatus.state === "denied") {
          setPermissionDenied(true);
          setError(labels[23] || "Location permission is denied. Please enable it.");
        }
        permissionStatus.onchange = () => {
          if (permissionStatus.state === "granted") {
            setPermissionDenied(false);
            setError(null);
          }
        };
      } catch {
        console.warn(labels[22] || "Permission API might not be supported.");
      }
    };

    handleLocationPermission();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setError(null); // Clear errors on successful fetch
      },
      (err) => {
        setError(labels[8] || "Unable to retrieve your location");
        if (err.code === 1) {
          setPermissionDenied(true); // Permission denied
        }
      }
    );

    // Cleanup on component unmount
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const requestLocationAccess = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setError(null);
        setPermissionDenied(false);
      },
      (err) => {
        if (err.code === 1) {
          setError(labels[18] || "Permission denied. Please enable location access in your browser settings."
          );
        } else if (err.code === 2) {
          setError(labels[19] || "Location unavailable. Ensure GPS is enabled.");
        } else if (err.code === 3) {
          setError(labels[20] || "Request timed out. Try again.");
        } else {
          setError(labels[21] || "An unknown error occurred.");
        }
      }
    );
  };

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [currentCameraQuestion, setCurrentCameraQuestion] = useState(null); // Store current question object
  const [cameraPermission, setCameraPermission] = useState(null); // Tracks camera permission state
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const webcamRef = useRef(null);
  // Trigger when the video starts playing
  const handleUserMedia = () => {
    setIsWebcamActive(true);
  };
  const canvasRef = useRef(null); // Create a ref for the canvas

  const [rotation, setRotation] = useState({});
  const handleRotate = (questionId) => {
    setRotation((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || 0) + 0, // Increment rotation by 90 degrees
    }));

    // Get the current image from answers
    const imageSrc = answers[questionId];
    if (imageSrc) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = imageSrc;

      img.onload = () => {
        const currentRotation = (rotation[questionId] || 0) + 90; // Use rotation state instead of prev
        canvas.width = img.height; // Set canvas width to image height for rotation
        canvas.height = img.width; // Set canvas height to image width for rotation
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2); // Move to center of canvas
        ctx.rotate((currentRotation * Math.PI) / 180); // Rotate the canvas
        ctx.drawImage(img, -img.width / 2, -img.height / 2); // Draw the image centered
        ctx.restore();

        // Get the rotated image as a base64 string
        const rotatedBase64 = canvas.toDataURL();
        setAnswers((prevAnswers) => ({
          ...prevAnswers,
          [questionId]: rotatedBase64, // Update the answer with the rotated image
        }));
      };
    }
  };


  useEffect(() => {
    const fetchLabel = async () => {
      try {
        const labelResponse = await axios.get(
          `sukrtya/api/language-labels/getLabels?formId=4&regLId=${localStorage.getItem("language")}`
        );
        setLabels(labelResponse.data[0]); // Assuming response is an array with labels as key-value pairs
      } catch (error) {
        console.error("Error fetching labels:", error);
      }
    };

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken"); // Retrieve token from localStorage
        const response = await axios.get(
          `/sukrtya/api/questions?formId=${formId}&transActionId=${transActionId}&RegLId=${localStorage.getItem("language")}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setQuestions(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Token expired, redirect to login with message
          alert(labels[25] || "Session expired. Please log in again.");
          localStorage.clear();
          window.location.href = "/";

        } else {
          setError(labels[26] || "Error fetching data " + " : " + error);
          console.error("Error fetching data:", error);
        }


      }
    };
    fetchLabel();
    fetchData();
  }, [formId, transActionId, RegLId]);
  // Apply skip logic once `answers` is populated
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;

    const initialHiddenQuestions = new Set();

    questions.forEach((question) => {
      const { questionId, skipanswer, skipQuestionId, answer } = question;

      // Check if the question has skip logic
      if (skipanswer) {
        const skipAnswers = skipanswer.split("/").map(Number);

        // Hide questions initially if their dependent question has not been answered
        if (!answers[questionId]) {
          if (skipQuestionId) {
            const startIndex = questions.findIndex(
              (q) => q.questionId === questionId
            );
            const endIndex = questions.findIndex(
              (q) => q.questionId === skipQuestionId
            );

            for (let i = startIndex + 1; i < endIndex; i++) {
              initialHiddenQuestions.add(questions[i].questionId);
            }
          }
        }

        // Hide questions if the skip condition is met
        const shouldSkip = skipAnswers.includes(Number(answers[questionId]));
        if (shouldSkip && skipQuestionId) {
          const startIndex = questions.findIndex(
            (q) => q.questionId === questionId
          );
          const endIndex = questions.findIndex(
            (q) => q.questionId === skipQuestionId
          );

          for (let i = startIndex + 1; i < endIndex; i++) {
            initialHiddenQuestions.add(questions[i].questionId);
          }
        }
      }
    });

    setHiddenQuestions(initialHiddenQuestions);
  }, [answers, questions]);


  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "camera" }).then((result) => {
        setCameraPermission(result.state);
        result.onchange = () => setCameraPermission(result.state);
      });
    } else {
      setCameraPermission("unknown"); // Handle older browsers
    }
  }, []);
  const requestCameraAccess = (question) => {
    //alert("Camera access is required to capture images."); // Show alert before requesting permission
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "Your browser does not support camera access. Please use a modern browser like Chrome."
      );
    }
    // After alert, request camera permission
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        setCameraPermission("granted");
        setCurrentCameraQuestion(question);
        setShowCameraModal(true); // Automatically open modal after permission is granted
      })
      .catch((err) => {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setError(labels[27] || "Camera access denied by user.");
          //alert("Camera access denied by user.");
          setCameraPermission("denied");
        } else if (err.name === "NotFoundError") {
          setError(labels[28] || "No camera found on this device.");
          //alert("No camera found on this device.");
          setCameraPermission("not_found");
        } else {
          setError(labels[29] || "Error accessing camera:" + err);
          //alert("Error accessing camera:" + err);
          setCameraPermission("error");
        }
      });
  };

  // Initialize answers based on fetched questions
  useEffect(() => {
    const initialAnswers = questions.reduce((acc, question) => {
      acc[question.questionId] = question.answer || "";
      return acc;
    }, {});
    setAnswers(initialAnswers);
  }, [questions]);


  const handleInputChange = (questionId, value) => {
    // Sanitize input (basic example)
    const sanitizedValue = value.replace(/<[^>]*>/g, ''); // Remove HTML tags
   // Define the allowed pattern (disallow *, <, and >)
    const allowedPattern = /^[^*<>]*$/;

    if (allowedPattern.test(sanitizedValue)) {
      // Update answers and clear error for the question
      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [questionId]: sanitizedValue,
      }));
      // Clear the error for the specific question
      setErrors((prevErrors) => ({
        ...prevErrors,
        [questionId]: null,
      }));
    } else {
      // Set an error for the specific question
      setErrors((prevErrors) => ({
        ...prevErrors,
        [questionId]: localStorage.getItem("language") === "1" ? 'Invalid input detected! Only *, <, and > are not allowed.' : 'अमान्य इनपुट पाया गया! केवल *, <, और > की अनुमति नहीं है।',
      }));
    }


    // Update the answers state
    const updatedAnswers = { ...answers, [questionId]: value };

    // Set to manage hidden questions
    const initialHiddenQuestions = new Set(hiddenQuestions);

    questions.forEach((question) => {
      if (question.skipQuestionId && question.skipanswer) {
        const skipAnswers = question.skipanswer.split("/").map(Number);

        if (question.questionId === questionId) {
          const startIndex = questions.findIndex(
            (q) => q.questionId === questionId
          );
          const endIndex = questions.findIndex(
            (q) => q.questionId === question.skipQuestionId
          );

          // If value is empty, hide and clear dependent questions
          if (!value) {
            for (let i = startIndex + 1; i < endIndex; i++) {
              const dependentQuestion = questions[i];
              initialHiddenQuestions.add(dependentQuestion.questionId);
              delete updatedAnswers[dependentQuestion.questionId]; // Clear dependent question's value
            }
          } else {
            // Otherwise, handle conditional hiding based on skip logic
            const shouldSkip = skipAnswers.includes(Number(value));
            for (let i = startIndex + 1; i < endIndex; i++) {
              const dependentQuestion = questions[i];
              if (shouldSkip) {
                initialHiddenQuestions.add(dependentQuestion.questionId);
                delete updatedAnswers[dependentQuestion.questionId]; // Clear value on hide
              } else {
                initialHiddenQuestions.delete(dependentQuestion.questionId);
              }
            }
          }
        }
      }
    });

    setAnswers(updatedAnswers); // Update the answers state
    setHiddenQuestions(initialHiddenQuestions); // Update the hidden questions state
  };

  const base64ToBlob = (base64, mimeType = "image/jpeg") => {
    const byteCharacters = atob(base64.split(",")[1]); // Decode base64
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };
  const compressImage = async (base64Image) => {
    try {
      // Convert base64 to Blob
      const imageBlob = base64ToBlob(base64Image);

      // Compression options
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      // Compress the Blob
      const compressedBlob = await imageCompression(imageBlob, options);

      // Convert compressed Blob back to base64
      const compressedBase64 = await imageCompression.getDataUrlFromFile(
        compressedBlob
      );
      return compressedBase64;
    } catch (error) {
      console.error("Image compression failed:", error);
      return null;
    }
  };
  const calculateBase64FileSize = (base64String) => {
    const padding = (base64String.match(/=/g) || []).length;
    const base64Length = base64String.length;
    const sizeInBytes = base64Length * (3 / 4) - padding;
    const sizeInKB = sizeInBytes / 1024;
    return sizeInKB.toFixed(2); // Size in KB
  };
  const captureImage = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const compressedBase64 = await compressImage(imageSrc);
        const fileSize = calculateBase64FileSize(compressedBase64);
        setImageSize(fileSize);
        setAnswers((prevAnswers) => ({
          ...prevAnswers,
          [currentCameraQuestion.questionId]: compressedBase64,
        }));
        setShowCameraModal(false); // Close the modal after capturing
      } else {
        alert("Failed to capture image. Please try again.");
      }
    } else {
      alert("Webcam is not ready. Please wait.");
    }
  };

  const openCameraModal = (question) => {
    setCurrentCameraQuestion(question);
    setShowCameraModal(true);
  };

  const validateForm = () => {
    const newErrors = {};
    let firstInvalidField = null;
    questions.forEach((question) => {
      const {
        questionId,
        isMandate,
        minvalue,
        maxvalue,
        questionName,
        questionType,
      } = question;

      if (
        isMandate === "1" &&
        !hiddenQuestions.has(questionId) &&
        !answers[questionId]
      ) {
        newErrors[questionId] = localStorage.getItem("language") === "1" ? "This field is required." : "यह फ़ील्ड आवश्यक है।";
        if (!firstInvalidField) firstInvalidField = questionId;
      }

      // Validate numeric range
      if (questionType === "Numeric" && answers[questionId]) {
        const numericValue = parseFloat(answers[questionId]);
        if (minvalue && numericValue < minvalue) {
          newErrors[
            questionId
          ] = localStorage.getItem("language") === "1" ? `Please enter a number should be at least ${minvalue}` : `कृपया संख्या कम से कम ${minvalue} दर्ज करें। `;
          if (!firstInvalidField) firstInvalidField = questionId;
        }
        if (maxvalue && numericValue > maxvalue) {
          newErrors[
            questionId
          ] =  localStorage.getItem("language") === "1" ? `Please enter less than ${maxvalue}` : `कृपया ${maxvalue} से कम दर्ज करें। ` ;
          if (!firstInvalidField) firstInvalidField = questionId;
        }
      }
    });
    if (firstInvalidField !== null) {
      // Focus the first invalid field
      inputRefs.current[firstInvalidField]?.focus();
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
  const handleSubmit = async () => {
    setLoading(true); // Start loading
    if (validateForm()) {
      try {
        const token = localStorage.getItem("authToken"); // Retrieve token from localStorage
        const responses = await axios.post(
          "/sukrtya/api/assessments/save",
          {
            transactionId: transActionId,
            latitude: latitude,
            longitude: longitude,
            googleAddress: address,
            userId: localStorage.getItem("userID"),
            formId: formId,
            facilityNIN: myObject.facilityNin,
            postAnswer: Object.entries(answers)
              .map(([questionId, value]) => ({
                questionId: parseInt(questionId),
                questionType: questions.find(
                  (q) => q.questionId === parseInt(questionId)
                ).questionType,
                answer: value,
              }))
              .filter((item) => item.answer),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`, // Pass token in the Authorization header
            },
          });
        if (responses.data.status === "success") {
          alert(labels[14] || "Form submitted successfully");
          navigate("/facility-trans", { state: { object: serializedObject } });
          setLoading(false); // stop loading
        } else {
          alert(responses.data.status + " - " + responses.data.message);
          setLoading(false); // stop loading
        }
      }
      catch (error) {
        if (error.response && error.response.status === 401) {
          // Token expired, redirect to login with message
          alert(labels[25] || "Session expired. Please log in again.");
          localStorage.clear();
          window.location.href = "/";

        } else {
          console.error(labels[26] || "Error fetching data:", error);
          setLoading(false); // stop loading
        }
      }



    }
    setLoading(false);
  };
  const renderQuestion = (question) => {
    const {
      questionId,
      questionName,
      questionType,
      questionOptions,
      isMandate,
      maxvalue,
      minvalue,
    } = question;

    if (hiddenQuestions.has(questionId)) return null;

    switch (questionType) {
      case "Single Choice":
        return (
          <div className="col-md-6 col-lx-6" key={questionId}>
            <div className="form-group">
              <label>
                {questionName}
                {isMandate === "1" && (
                  <span style={{ color: "red", marginLeft: "5px" }}>*</span>
                )}
              </label>

              <select
                ref={(el) => (inputRefs.current[questionId] = el)}
                className={`text-primary form-control form-select ${errors[questionId] ? "is-invalid" : ""
                  }`}
                value={answers[questionId] || ""}
                onChange={(e) => handleInputChange(questionId, e.target.value)}
              >
                {localStorage.getItem("language") === "1" ? <option value="">Select an option</option> : <option value="">एक विकल्प चुनें</option>}

                {questionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.text}
                  </option>
                ))}
              </select>
              {errors[questionId] && (
                <p className="invalid-feedback">{errors[questionId]}</p>
              )}
            </div>
          </div>
        );

      case "Camera":
        return (
          <div className="col-md-6 col-lx-6" key={questionId}>
            <div className="form-group">
              <label>
                {questionName}
                {isMandate === "1" && (
                  <span style={{ color: "red", marginLeft: "5px" }}>*</span>
                )}
              </label>
              <div>
                <>
                  {answers[questionId] && (

                    <div className="image-container">
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                      <img
                        src={answers[questionId]}
                        title={`File Size: ${imageSize} KB`}
                        alt="Captured"
                        className="img-thumbnail captured-image mb-4"
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                          transform: `rotate(${rotation[questionId] || 0}deg)`,
                          transition: "transform 0.5s ease",
                          display: "block",
                          margin: "0 auto",
                          transformOrigin: "center",
                          padding: rotation[questionId] ? "10px" : "0",
                        }}
                      />
                    </div>
                  )}
                  {answers[questionId] && (
                    <button
                      type="button"
                      onClick={() => handleRotate(questionId)}
                      className="btn btn-outline-primary btn-icon-text me-2 mr-2 ml-2"
                    >
                      <i className="ti-loop btn-icon-prepend"></i> {labels[6] || "Rotate Image"}
                    </button>
                  )}
                  <button
                    onClick={() => openCameraModal(question)}
                    type="button"
                    className="btn btn-outline-success btn-icon-text mr-2 ml-2"
                  >
                    <i className="ti-camera btn-icon-prepend"></i> {labels[2] || "Capture Image"}
                  </button>

                  {errors[questionId] && (
                    <p className="error-message">{errors[questionId]}</p>
                  )}
                </>
              </div>
            </div>
          </div>
        );

      case "Numeric":
        return (
          <div className="col-md-6 col-lx-6" key={questionId}>
            <div className="form-group">
              <label>
                {questionName}
                {isMandate === "1" && (
                  <span style={{ color: "red", marginLeft: "5px" }}>*</span>
                )}
              </label>
              <input
                ref={(el) => (inputRefs.current[questionId] = el)}
                type="number" autoComplete="off"
                min={minvalue}
                max={maxvalue}
                className={`text-primary form-control ${errors[questionId] ? "is-invalid" : ""
                  }`}
                placeholder="0"
                value={answers[questionId] || ""}
                onChange={(e) => handleInputChange(questionId, e.target.value)}
                onKeyDown={(e) => {
                  if (['e', 'E', '+', '-'].includes(e.key)) {
                    e.preventDefault(); // Prevent restricted keys
                  }
                }}
                onInput={(e) => {
                  const value = e.target.value;
                  if (/[eE+\-]/.test(value)) {
                    e.target.value = value.replace(/[eE+\-]/g, ''); // Remove invalid characters
                  }
                }}
              />
              {errors[questionId] && (
                <p className="invalid-feedback">{errors[questionId]}</p>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="col-md-6 col-lx-6" key={questionId}>
            <div className="form-group">
              <label>
                {questionName}
                {isMandate === "1" && (
                  <span style={{ color: "red", marginLeft: "5px" }}>*</span>
                )}
              </label>
              <input
                ref={(el) => (inputRefs.current[questionId] = el)}
                type="text" autoComplete="off"
                placeholder="type here.."
                maxLength={maxvalue}
                className={`text-primary form-control ${errors[questionId] ? "is-invalid" : ""
                  }`}
                value={answers[questionId] || ""}
                onChange={(e) => handleInputChange(questionId, e.target.value)}
              />
              {errors[questionId] && (
                <p className="invalid-feedback">{errors[questionId]}</p>
              )}
            </div>
          </div>
        );
    }
  };
  // Toggle between front and back cameras
  const toggleCamera = () => {
    setFacingMode((prevMode) =>
      prevMode === "user" ? { exact: "environment" } : "user"
    );
  };

  const videoConstraints = {
    facingMode: facingMode,
    // width: 1280,
    // height: 720,
  };
  return (
    <Base title="Entry Form">
      <div className="container-fluid page-body-wrapper">
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row ">
              <div className="col-md-12">
                <h3 className="font-weight-bold text-capitalize">
                  {labels[1] || "Welcome"},{" "}
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
            </div>
            <div className="row">
              <div className="col-md-8 mt-4">
                <HeadingData heading={myObject} />
              </div>
            </div>
 
            {(permissionDenied) ? (
              <div className="row mt-4">
                <div className="row-md-4"></div>
                <div className="row-md-4">
                  <div className="card">
                    <div className="card-body text-center">
                      <img
                        className="img-fluid"
                        src="./images/enable-location-services-pop-up-permission.png"
                      />
                      {error && <h4 style={{ color: "red" }}>{error}</h4>}
                      <button
                        onClick={requestLocationAccess}
                        className="btn btn-link  "
                        style={{
                          color: "blue",
                          textDecoration: "underline",
                        }}
                      >
                        {labels[9] || "Click here to allow location"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="row-md-4"></div>
              </div>
            ) : (
              <>
                {questions && questions.length > 0 ? (
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="row mt-4">
                      {questions
                        .filter((question) => !hiddenQuestions.has(question.questionId))
                        .map((question) => renderQuestion(question))}
                    </div>
                    <div className="">
                      {latitude && longitude ? (
                        <button
                          style={{ width: "200px" }}
                          disabled={loading}
                          className="btn btn-primary mr-2"
                          type="button"
                          onClick={handleSubmit}
                        >
                          {loading ? labels[15] || "Please Wait..." : labels[7] || "Submit"}
                        </button>
                      ) : (
                        <>
                        <img
                          style={{ height: "50px", width: "50px" }}
                          src="./images/loading.gif"
                        />
                        <p> {labels[17] || "Fetching location..."}</p></>
                      )}
                    </div>

                    {showCameraModal && (
                      <div className="modal">
                        <div className="modal-content">
                          <div className="modal-header  text-left">
                            <strong>
                              {currentCameraQuestion?.questionName}{" "}
                            </strong>
                          </div>

                          {cameraPermission === "granted" ? (
                            <>
                              <div className="modal-body">
                                <Webcam
                                  audio={false}
                                  videoConstraints={videoConstraints}
                                  ref={webcamRef}
                                  screenshotFormat="image/jpeg"
                                  className="webcam"
                                  onUserMedia={handleUserMedia}
                                  onUserMediaError={() =>
                                    setIsWebcamActive(false)
                                  }
                                  style={{ width: "100%", height: "auto" }}
                                />
                                <div style={{ textAlign: "left" }}>
                                  <button
                                    onClick={toggleCamera}
                                    type="button"
                                    className="btn  btn-sm btn-toggle"
                                    data-toggle="button"
                                    aria-pressed="false"
                                    autoComplete="off"
                                  >
                                    <div className="switch"></div>{" "}
                                    <div className="facing-mode-container">
                                      {facingMode === "user" ? (
                                        <span style={{ paddingLeft: "20px" }}>
                                          {labels[3] || "Back Camera"}
                                        </span>
                                      ) : (
                                        <span style={{ paddingRight: "40px" }}>
                                          {labels[16] || "Front Camera"}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                </div>
                              </div>

                              <div
                                className="modal-footer"
                                style={{ marginBottom: "-20px" }}
                              >
                                <button
                                  className="btn btn-outline-dark"
                                  onClick={() => setShowCameraModal(false)}
                                >
                                  {labels[4] || "Close"}
                                </button>

                                <button
                                  onClick={captureImage}
                                  disabled={!isWebcamActive} // Disable button if webcam is not active
                                  className="btn btn-success btn-icon-text "
                                >
                                  <i className="ti-camera btn-icon-prepend"></i>{" "}
                                  {labels[5] || "Capture"}
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <img
                                style={{ height: "150px", width: "150px" }}
                                src="./images/camera-off-icon.png"
                              />
                              <h3 className="text-danger">
                                {labels[10] || "Camera access is denied."}
                              </h3>
                              <p> {labels[11] || "Please allow camera access"}</p>
                              {error && <p style={{ color: "red" }}>{error}</p>}
                              <button
                                onClick={requestCameraAccess}
                                style={{
                                  color: "blue",
                                  textDecoration: "underline",
                                }}
                                className="btn btn-link mb-5"
                              >
                                {labels[12] || "Click here to allow camera permission"}
                              </button>

                              <div
                                className="modal-footer"
                                style={{ marginBottom: "-20px" }}
                              >
                                <button
                                  type="button"
                                  className="btn btn-outline-dark"
                                  onClick={() => setShowCameraModal(false)}
                                  aria-label="Close"
                                >
                                  {labels[4] || "Close"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="text-center">
                    <br /> <br />
                    <img
                      src="./images/loading.gif"
                      style={{ height: "100px" }}
                    />
                    {error && <p style={{ color: "red" }}>{error}</p>}
                  </div> // Or display a placeholder message
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Base>
  );
}
