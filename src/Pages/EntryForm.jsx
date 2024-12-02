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
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    const handleLocationPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });
        if (permissionStatus.state === "denied") {
          setPermissionDenied(true);
          setError("Location permission is denied. Please enable it.");
        }
        permissionStatus.onchange = () => {
          if (permissionStatus.state === "granted") {
            setPermissionDenied(false);
            setError(null);
          }
        };
      } catch {
        console.warn("Permission API might not be supported.");
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
        setError("Unable to retrieve your location.");
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
          setError(
            "Permission denied. Please enable location access in your browser settings."
          );
        } else if (err.code === 2) {
          setError("Location unavailable. Ensure GPS is enabled.");
        } else if (err.code === 3) {
          setError("Request timed out. Try again.");
        } else {
          setError("An unknown error occurred.");
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
  const [rotation, setRotation] = useState({});
  const handleRotate = (questionId) => {
    setRotation((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || 0) + 90, // Increment rotation by 90 degrees
    }));
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `/api/questions/getQuestionDetails?formId=${formId}&transActionId=${transActionId}&RegLId=${RegLId}`
        );
        setQuestions(response.data);
      } catch (error) {
        setError("Error fetching data : " + error);
        console.error("Error fetching data:", error);
      }
    };
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
          setError("Camera access denied by user.");
          //alert("Camera access denied by user.");
          setCameraPermission("denied");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
          //alert("No camera found on this device.");
          setCameraPermission("not_found");
        } else {
          setError("Error accessing camera:" + err);
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
    // Update answers and clear error for the question
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [questionId]: null,
    }));

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
        newErrors[questionId] = "This field is required.";
        if (!firstInvalidField) firstInvalidField = questionId;
      }

      // Validate numeric range
      if (questionType === "Numeric" && answers[questionId]) {
        const numericValue = parseFloat(answers[questionId]);
        if (minvalue && numericValue < minvalue) {
          newErrors[
            questionId
          ] = `${questionName} must be at least ${minvalue}`;
          if (!firstInvalidField) firstInvalidField = questionId;
        }
        if (maxvalue && numericValue > maxvalue) {
          newErrors[
            questionId
          ] = `${questionName} must be no more than ${maxvalue}`;
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
      const responses = await axios.post("/api/assessment/save", {
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
      });

      if (responses.data.status === "success") {
        alert("Form submitted successfully");
        navigate("/facility-trans", { state: { object: serializedObject } });
      } else {
        alert(responses.data.status + " - " + responses.data.message);
      }
    }
    setLoading(false); // stop loading
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
                className={`text-primary form-control ${
                  errors[questionId] ? "is-invalid" : ""
                }`}
                value={answers[questionId] || ""}
                onChange={(e) => handleInputChange(questionId, e.target.value)}
              >
                <option value="">Select an option</option>
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
                    <>
                      <img
                        src={answers[questionId]}
                        title={`File Size: ${imageSize} KB`}
                        alt="Captured"
                        className="captured-image mb-4"
                        style={{
                          transform: `rotate(${rotation[questionId] || 0}deg)`,
                          transition: "transform 0.5s ease",
                        }}
                      />
                    </>
                  )}
                  {answers[questionId] && (
                    <button
                      type="button"
                      onClick={() => handleRotate(questionId)}
                      className="btn btn-outline-primary btn-icon-text me-2 mr-2 ml-2"
                    >
                      <i className="ti-loop btn-icon-prepend"></i> Rotate Image
                    </button>
                  )}
                  <button
                    onClick={() => openCameraModal(question)}
                    type="button"
                    className="btn btn-outline-success btn-icon-text mr-2 ml-2"
                  >
                    <i className="ti-camera btn-icon-prepend"></i> Capture Image
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
                type="number"
                min={minvalue}
                max={maxvalue}
                className={`text-primary form-control ${
                  errors[questionId] ? "is-invalid" : ""
                }`}
                placeholder="0"
                value={answers[questionId] || ""}
                onChange={(e) => handleInputChange(questionId, e.target.value)}
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
                type="text"
                placeholder="type here.."
                maxLength={maxvalue}
                className={`text-primary form-control ${
                  errors[questionId] ? "is-invalid" : ""
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
                  Welcome,{" "}
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

            {permissionDenied ? (
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
                        Click here to allow location
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
                          {loading ? "Please Wait..." : "Submit"}
                        </button>
                      ) : (
                        <p>Fetching location...</p>
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
                                    class="btn  btn-sm btn-toggle"
                                    data-toggle="button"
                                    aria-pressed="false"
                                    autocomplete="off"
                                  >
                                    <div class="switch"></div>{" "}
                                    <div className="facing-mode-container">
                                      {facingMode === "user" ? (
                                        <span style={{ paddingLeft: "20px" }}>
                                          Back Camera
                                        </span>
                                      ) : (
                                        <span style={{ paddingRight: "40px" }}>
                                          Front Camera
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
                                  Close
                                </button>

                                <button
                                  onClick={captureImage}
                                  disabled={!isWebcamActive} // Disable button if webcam is not active
                                  className="btn btn-success btn-icon-text "
                                >
                                  <i className="ti-camera btn-icon-prepend"></i>{" "}
                                  Capture
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
                                Camera access is denied.
                              </h3>
                              <p>Please allow camera access</p>
                              {error && <p style={{ color: "red" }}>{error}</p>}
                              <button
                                onClick={requestCameraAccess}
                                style={{
                                  color: "blue",
                                  textDecoration: "underline",
                                }}
                                className="btn btn-link mb-5"
                              >
                                Click here to allow camera permission
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
                                  Close
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
