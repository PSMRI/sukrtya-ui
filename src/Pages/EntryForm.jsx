import React, { useEffect, useRef, useState, useCallback } from "react";
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
  const { formId, transActionId, user, approvalStatus, lat, lon, gaddress } =
    location.state;
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

  const handleLocationError = useCallback(
    (err) => {
      const errorMessages = {
        1:
          labels.permissionDenied ||
          "Permission denied. Please enable location access in your browser settings.",
        2:
          labels.locationUnavailable ||
          "Location unavailable. Ensure GPS is enabled.",
        3: labels.requestTimedOut || "Request timed out. Try again.",
        default: labels.unknownError || "An unknown error occurred.",
      };
      setPermissionDenied(err.code === 1); // Set permissionDenied to true only if permission is denied
      setError(errorMessages[err.code] || errorMessages.default);
    },
    [labels]
  );

  const requestLocationAccess = useCallback(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setError(null); // Clear errors on success
      setPermissionDenied(false);
    }, handleLocationError);
  }, [handleLocationError]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(
        labels.geolocationNotSupported ||
          "Geolocation is not supported by your browser."
      );
      return;
    }

    const handlePermissionChange = (state) => {
      if (state === "granted") {
        setPermissionDenied(false);
        setError(null);
      } else if (state === "denied") {
        setPermissionDenied(true);
        setError(
          labels.permissionDenied ||
            "Location permission is denied. Please enable it."
        );
      }
    };

    const handleLocationPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });

        if (permissionStatus.state === "denied") {
          handlePermissionChange("denied");
        }

        // Listen for permission changes
        permissionStatus.onchange = () =>
          handlePermissionChange(permissionStatus.state);
      } catch {
        console.warn(
          labels.permissionApiUnsupported ||
            "Permission API might not be supported."
        );
      }
    };

    handleLocationPermission();

    const watchId = navigator.geolocation.watchPosition((position) => {
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setError(null); // Clear errors on success
    }, handleLocationError);

    return () => navigator.geolocation.clearWatch(watchId);
  }, [labels, handleLocationError]);

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
    //console.log(formId+" || "+ transActionId+" || "+ user+" || "+approvalStatus+" || "+ lat+" || "+lon+" || "+ gaddress );
    const fetchLabel = async () => {
      try {
        const labelResponse = await axios.get(
          `/sukrtya/api/language-labels/getLabels?formId=4&regLId=${localStorage.getItem(
            "language"
          )}`
        );
        setLabels(labelResponse.data[0]); // Assuming response is an array with labels as key-value pairs
      } catch (error) {
        console.error("Error fetching labels:", error);
      }
    };

    fetchLabel();
  }, []); // Fetch labels only once on mount

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken"); // Retrieve token from localStorage
        const response = await axios.get(
          `/sukrtya/api/questions?formId=${formId}&transActionId=${transActionId}&RegLId=${localStorage.getItem(
            "language"
          )}`,
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
          alert(labels?.[25] || "Session expired. Please log in again.");
          localStorage.clear();
          window.location.href = "/";
        } else {
          setError(labels?.[26] || `Error fetching data: ${error.message}`);
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [formId, transActionId, labels]); // Include 'labels' since it is used in the error handling

  // Apply skip logic once `answers` is populated
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;

    const initialHiddenQuestions = new Set();

    questions.forEach((question) => {
      const { questionId, skipanswer, skipQuestionId } = question;

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
    const sanitizedValue = value.replace(/<[^>]*>/g, ""); // Remove HTML tags
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
        [questionId]:
          localStorage.getItem("language") === "1"
            ? "Invalid input detected! Only *, <, and > are not allowed."
            : "अमान्य इनपुट पाया गया! केवल *, <, और > की अनुमति नहीं है।",
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

        questionType,
      } = question;

      if (
        isMandate === "1" &&
        !hiddenQuestions.has(questionId) &&
        !answers[questionId]
      ) {
        newErrors[questionId] =
          localStorage.getItem("language") === "1"
            ? "This field is required."
            : "यह फ़ील्ड आवश्यक है।";
        if (!firstInvalidField) firstInvalidField = questionId;
      }

      // Validate numeric range
      if (questionType === "Numeric" && answers[questionId]) {
        const numericValue = parseFloat(answers[questionId]);
        if (minvalue && numericValue < minvalue) {
          newErrors[questionId] =
            localStorage.getItem("language") === "1"
              ? `Please enter a number should be at least ${minvalue}`
              : `कृपया संख्या कम से कम ${minvalue} दर्ज करें। `;
          if (!firstInvalidField) firstInvalidField = questionId;
        }
        if (maxvalue && numericValue > maxvalue) {
          newErrors[questionId] =
            localStorage.getItem("language") === "1"
              ? `Please enter less than ${maxvalue}`
              : `कृपया ${maxvalue} से कम दर्ज करें। `;
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

  const fetchData = async (url, method, data, token) => {
    try {
      const response = await axios({
        url,
        method,
        data,
        headers: { Authorization: `Bearer ${token}` },
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  const constructPostAnswers = (answers, questions) =>
    Object.entries(answers)
      .map(([questionId, value]) => ({
        questionId: parseInt(questionId),
        questionType: questions.find(
          (q) => q.questionId === parseInt(questionId)
        )?.questionType,
        answer: value,
      }))
      .filter((item) => item.answer);

  const handleSubmit = async () => {
    setLoading(true);

    if (validateForm()) {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userID");
      const profileName = localStorage.getItem("profileName");

      const postData = {
        transactionId: transActionId,
        userId: user === null ? userId : user,
        formId,
        facilityNIN: myObject.facilityNin,
        postAnswer: constructPostAnswers(answers, questions),
      };
      console.log(
        "formId : " +
          formId +
          " || transActionId : " +
          transActionId +
          " || user : " +
          user +
          " || approvalStatus : " +
          approvalStatus +
          " || lat : " +
          lat +
          " || lon : " +
          lon +
          " || gaddress : " +
          gaddress
      );

      if (
        localStorage.getItem("isApprover") === "0" ||
        transActionId === null
      ) {
        Object.assign(postData, {
          latitude,
          longitude,
          googleAddress: address,
        });
      } else {
        if (
          user === localStorage.getItem("userID") &&
          localStorage.getItem("isApprover") === "0"
        ) {
          Object.assign(postData, {
            latitude,
            longitude,
            googleAddress: address,
          });
        } else {
          Object.assign(postData, {
            latitude: lat,
            longitude: lon,
            googleAddress: gaddress,
          });
        }
      }

      try {
        const saveResponse = await fetchData(
          "/sukrtya/api/assessments/save",
          "post",
          postData,
          token
        );
        console.log(postData);

        await fetchData(
          "/sukrtya/api/form-approval/auditTrail",
          "post",
          {
            actionId: 1,
            description: `Update by ${profileName}`,
            createdBy: userId,
            transactionId: transActionId,
          },
          token
        );

        if (saveResponse.data.status === "success") {
          if(transActionId !==null && transActionId !=="") {
            alert("Form updated successfully");
          } else {
            alert("Form submitted successfully");
          }
          //alert(labels[14] || "Form submitted successfully");
          navigate("/facility-trans", { state: { object: serializedObject } });
        } else {
          alert(`${saveResponse.data.status} - ${saveResponse.data.message}`);
        }
      } catch (error) {
        handleErrors(error);
      } finally {
        setLoading(false);
      }
    }
    setLoading(false);
  };

  const handleApproval = async () => {
    setLoading(true);
    if (validateForm()) {
      if (
        window.confirm(
          labels[35] ||
            "I have confirmed the correctness and authenticity of the data and photos given, and I hereby approve."
        )
      ) {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userID");
        const profileName = localStorage.getItem("profileName");

        const postData = {
          transactionId: transActionId,
          userId: user,
          formId,
          facilityNIN: myObject.facilityNin,
          postAnswer: constructPostAnswers(answers, questions),
        };

        if (
          localStorage.getItem("isApprover") === "0" ||
          transActionId === null
        ) {
          Object.assign(postData, {
            latitude,
            longitude,
            googleAddress: address,
          });
        } else {
          if (
            user === localStorage.getItem("userID") &&
            localStorage.getItem("isApprover") === "0"
          ) {
            Object.assign(postData, {
              latitude,
              longitude,
              googleAddress: address,
            });
          } else {
            Object.assign(postData, {
              latitude: lat,
              longitude: lon,
              googleAddress: gaddress,
            });
          }
        }

        try {
          await fetchData(
            "/sukrtya/api/assessments/save",
            "post",
            postData,
            token
          );

          await fetchData(
            "/sukrtya/api/form-approval/update",
            "put",
            {
              userId: userId,
              approvalStatus: 2,
              formId,
              transactionId: transActionId,
            },
            token
          );

          await fetchData(
            "/sukrtya/api/form-approval/auditTrail",
            "post",
            {
              actionId: 2,
              description: `Approved by ${profileName}`,
              createdBy: userId,
              transactionId: transActionId,
            },
            token
          );

          alert("Approved successfully");
          navigate("/facility-trans", { state: { object: serializedObject } });
        } catch (error) {
          handleErrors(error);
        } finally {
          setLoading(false);
        }
      }
    }
    setLoading(false);
  };

  const handleRevoke = async () => {
    setLoading(true);

    if (
      window.confirm(
        labels[36] || "Are you sure you want to revoke the approval?"
      )
    ) {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userID");
      const profileName = localStorage.getItem("profileName");

      try {
        await fetchData(
          "/sukrtya/api/form-approval/update",
          "put",
          {
            userId: userId,
            approvalStatus: 0,
            formId,
            transactionId: transActionId,
          },
          token
        );

        await fetchData(
          "/sukrtya/api/form-approval/auditTrail",
          "post",
          {
            actionId: 4,
            description: `Revoked by ${profileName}`,
            createdBy: userId,
            transactionId: transActionId,
          },
          token
        );

        alert(labels[37] || "Revoked successfully");
        navigate("/facility-trans", { state: { object: serializedObject } });
      } catch (error) {
        handleErrors(error);
      } finally {
        setLoading(false);
      }
    }
    setLoading(false);
  };

  const handleErrors = (error) => {
    if (error.response?.status === 401) {
      alert(labels[25] || "Session expired. Please log in again.");
      localStorage.clear();
      navigate("/login");
    } else {
      console.error(labels[26] || "Error fetching data:", error);
    }
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
                className={`text-primary form-control form-select ${
                  errors[questionId] ? "is-invalid" : ""
                }`}
                value={answers[questionId] || ""}
                onChange={(e) => handleInputChange(questionId, e.target.value)}
              >
                {localStorage.getItem("language") === "1" ? (
                  <option value="">Select an option</option>
                ) : (
                  <option value="">एक विकल्प चुनें</option>
                )}

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
                      <canvas ref={canvasRef} style={{ display: "none" }} />
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
                      <i className="ti-loop btn-icon-prepend"></i>{" "}
                      {labels[6] || "Rotate Image"}
                    </button>
                  )}
                  <button
                    onClick={() => openCameraModal(question)}
                    type="button"
                    className="btn btn-outline-success btn-icon-text mr-2 ml-2"
                  >
                    <i className="ti-camera btn-icon-prepend"></i>{" "}
                    {labels[2] || "Capture Image"}
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
                autoComplete="off"
                min={minvalue}
                max={maxvalue}
                className={`text-primary form-control ${
                  errors[questionId] ? "is-invalid" : ""
                }`}
                placeholder="0"
                value={answers[questionId] || ""}
                onChange={(e) => handleInputChange(questionId, e.target.value)}
                onKeyDown={(e) => {
                  if (["e", "E", "+", "-"].includes(e.key)) {
                    e.preventDefault(); // Prevent restricted keys
                  }
                }}
                onInput={(e) => {
                  const value = e.target.value;
                  if (/[eE+-]/.test(value)) {
                    e.target.value = value.replace(/[eE+-]/g, ""); // Removed unnecessary escape for '-'
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
                type="text"
                autoComplete="off"
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
            <div
              className="row"
              style={{
                display: "flex",
                alignItems: "center",
                fontFamily: "Arial, sans-serif",
                padding: "20px",
                backgroundColor: "#f0f0f0",
                borderRadius: "8px",
              }}
            >
              <div className="col-md-6 col-sm-12 col-xs-12 col-lg-6 col-xl-6">
                <div className="mobile-display">
                  <div className="font-weight-bold text-capitalize">
                    Welcome ,
                    <span className="text-success">
                      {localStorage.getItem("profileName")}
                    </span>{" "}
                    <br />{" "}
                    <small className="text-muted">
                      {localStorage.getItem("username")}
                    </small>
                  </div>
                </div>
                <HeadingData heading={myObject} />
              </div>
              <div className="col-md-2"></div>
              <div className="mobile-hidden col-md-4 col-sm-12 col-xs-12 col-lg-4 col-xl-4 text-right ">
                <h3 className="font-weight-bold text-capitalize">
                  Welcome,
                  <span className="text-success">
                    {localStorage.getItem("profileName").split(" ")[0]}
                  </span>
                </h3>

                <h6 className="font-weight-normal mb-0 ">
                  <span className="text-primary" title="Username">
                    {localStorage.getItem("username")}
                  </span>
                </h6>
                {transActionId && (
                  <div className="mt-4" title="Transaction ID">
                    <small>#</small>
                    <small className="text-success">{transActionId}</small>
                  </div>
                )}
              </div>
            </div>

            {(permissionDenied) ? (
              <div className="row mt-4">
                <div className="row-md-4"></div>
                <div className="row-md-4">
                  <div className="card">
                    <div className="card-body text-center">
                      <img
                        alt="location access"
                        className="img-fluid"
                        src="./images/enable-location-services-pop-up-permission.png" style={{height: "200px"}}
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
                      <br />
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "10px",
                          backgroundColor: "#ffcccb",
                          borderRadius: "5px",textAlign: "left"
                        }}
                      >
                        <p>
                          <strong>Location Access Blocked</strong>
                          <br />
                          It seems that location access has been blocked in your
                          browser settings. To enable it, please follow the
                          steps below:
                        </p>
                        <ul>
                          <li>
                            <strong>Chrome:</strong> Go to{" "}
                            <code>chrome://settings/content/location</code> and
                            enable location access.
                          </li>
                          <li>
                            <strong>Firefox:</strong> Go to{" "}
                            <code>about:preferences#privacy</code> and set
                            "Allow websites to access your location".
                          </li>
                          <li>
                            <strong>Safari:</strong> Go to Safari preferences,
                            click the "Privacy" tab, and allow location for the
                            website.
                          </li>
                        </ul>
                      </div>
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
                        .filter(
                          (question) =>
                            !hiddenQuestions.has(question.questionId)
                        )
                        .map((question) => renderQuestion(question))}
                    </div>
                    <div className="">
                      {transActionId != null &&
                        approvalStatus === 2 &&
                        localStorage.getItem("isApprover") === "0" && (
                          <h6>
                            {" "}
                            <strong className="text-success">
                              {labels[34] ||
                                "The data has been approved. To update the record, request an admin to revoke the approval."}
                            </strong>
                          </h6>
                        )}

                      {latitude && longitude ? (
                        <>
                          <p>
                            {" "}
                            <strong>
                              {labels[33] || "Your Current Location Details"} :
                            </strong>{" "}
                          </p>
                          <p>
                            Latitude: {latitude}, Longitude: {longitude}
                            <br />
                            Full Address: {address}
                          </p>

                          {transActionId == null && (
                            <button
                              style={{ width: "200px" }}
                              disabled={loading}
                              className="btn btn-primary mr-2"
                              type="button"
                              onClick={handleSubmit}
                            >
                              {loading ? (
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <img
                                    src="./loader.gif"
                                    alt="PLease wait..."
                                    style={{ width: "20px", height: "20px" }}
                                  />
                                  Please Wait...
                                </span>
                              ) : (
                                labels[7] || "Submit"
                              )}
                            </button>
                          )}
                          {transActionId !== null && approvalStatus !== 2 && (
                            <button
                              style={{ width: "200px" }}
                              className="btn btn-warning mr-2 mt-2"
                              type="button"
                              disabled={loading}
                              onClick={handleSubmit}
                            >
                              {loading ? (
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <img
                                    src="./loader.gif"
                                    alt="PLease wait..."
                                    style={{ width: "20px", height: "20px" }}
                                  />
                                  Please Wait...
                                </span>
                              ) : (
                                labels[30] || "Update"
                              )}
                            </button>
                          )}

                          {localStorage.getItem("isApprover") === "2" &&
                            transActionId !== null &&
                            approvalStatus !== 2 && (
                              <button
                                style={{ width: "200px" }}
                                className="btn btn-success mr-2 mt-2"
                                type="button"
                                disabled={loading}
                                onClick={handleApproval}
                              >
                                {loading
                                  ? labels[31] || "Approve"
                                  : labels[31] || "Approve"}
                              </button>
                            )}
                          {localStorage.getItem("isApprover") === "2" &&
                            approvalStatus === 2 && (
                              <button
                                style={{ width: "200px" }}
                                className="btn btn-danger mr-2 mt-2"
                                type="button"
                                disabled={loading}
                                onClick={handleRevoke}
                              >
                                {" "}
                                {loading ? (
                                  <span
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <img
                                      src="./loader.gif"
                                      alt="PLease wait..."
                                      style={{ width: "20px", height: "20px" }}
                                    />
                                    Please Wait...
                                  </span>
                                ) : (
                                  labels[32] || "Revoke"
                                )}
                              </button>
                            )}
                        </>
                      ) : (
                        <>
                          <img
                            alt="loading"
                            style={{ height: "50px", width: "50px" }}
                            src="./images/loading.gif"
                          />
                          <p> {labels[17] || "Fetching location..."}</p>
                        </>
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
<div className="modal-body" style={{ position: 'relative' }}>
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
  <div style={{ 
    position: 'absolute', 
    bottom: '30px', 
    right: '30px', 
    zIndex: 1000 
  }}>
    <button
      onClick={toggleCamera}
      type="button"
      className="btn btn-sm btn-light rounded-circle"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      title={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
    >
      <i className="ti-reload" style={{
        transform: 'scaleX(-1)',
        fontSize: '20px'
      }}></i>
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
                                alt="camera access denied"
                                style={{ height: "150px", width: "150px" }}
                                src="./images/camera-off-icon.png"
                              />
                              <h3 className="text-danger">
                                {labels[10] || "Camera access is denied."}
                              </h3>
                              <p>
                                {" "}
                                {labels[11] || "Please allow camera access"}
                              </p>
                              {error && <p style={{ color: "red" }}>{error}</p>}
                              <button
                                onClick={requestCameraAccess}
                                style={{
                                  color: "blue",
                                  textDecoration: "underline",
                                }}
                                className="btn btn-link mb-5"
                              >
                                {labels[12] ||
                                  "Click here to allow camera permission"}
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
                      alt="loading"
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

      <div
        className="floating-back-button"
        onClick={() => window.history.back()}
      >
        ← Back
      </div>
    </Base>
  );
}
