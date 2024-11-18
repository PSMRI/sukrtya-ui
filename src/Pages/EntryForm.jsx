import React, { useEffect, useRef, useState } from "react";
import Base from "../Components/Base";

import axios from "axios";
import { useLocation } from "react-router";
import Webcam from "react-webcam";
export default function EntryForm() {
  const location = useLocation();
  const { formId, transActionId, RegLId } = location.state;

  const date = new Date();
  const formattedDate = date
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, " ");

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const inputRefs = useRef({}); // Use refs for inputs
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [currentCameraQuestion, setCurrentCameraQuestion] = useState(null); // Store current question object
  const webcamRef = useRef(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://115.245.54.211:9090/api/questions/getQuestionDetails?formId=${formId}&transActionId=${transActionId}&RegLId=${RegLId}`
        );
        setQuestions(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [formId, transActionId, RegLId]);

  // Initialize answers based on fetched questions
  useEffect(() => {
    const initialAnswers = questions.reduce((acc, question) => {
      acc[question.questionId] = question.answer || "";
      return acc;
    }, {});
    setAnswers(initialAnswers);
  }, [questions]);

  const [hiddenQuestions, setHiddenQuestions] = useState(new Set());

  // Apply skip logic once `answers` is populated
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;

    const initialHiddenQuestions = new Set();

    questions.forEach((question) => {
      const { questionId, skipanswer, skipQuestionId, answer } = question;
      if (question && skipanswer) {
        const skipAnswers = skipanswer.split("/").map(Number);

        const shouldSkip = skipAnswers.includes(Number(answers[questionId]));

        if (shouldSkip) {
          for (let i = questionId + 1; i < skipQuestionId; i++) {
            initialHiddenQuestions.add(i);
          }
        } else {
          for (let i = questionId + 1; i < skipQuestionId; i++) {
            initialHiddenQuestions.delete(i);
          }
        }
      }
    });

    setHiddenQuestions(initialHiddenQuestions);
  }, [answers, questions]);

  const handleInputChange = (questionId, value) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [questionId]: null,
    }));

    const question = questions.find((q) => q.questionId === questionId);
    if (question && question.skipanswer) {
      const skipAnswers = question.skipanswer.split("/").map(Number);
      const shouldSkip = skipAnswers.includes(Number(value));
      setHiddenQuestions((prevHidden) => {
        const updated = new Set(prevHidden);
        if (shouldSkip) {
          for (
            let i = question.questionId + 1;
            i < question.skipQuestionId;
            i++
          ) {
            updated.add(i);
          }
        } else {
          for (
            let i = question.questionId + 1;
            i < question.skipQuestionId;
            i++
          ) {
            updated.delete(i);
          }
        }
        return updated;
      });
    }
  };

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [currentCameraQuestion.questionId]: imageSrc,
    }));
    setShowCameraModal(false); // Close the modal after capturing
  };

  const openCameraModal = (question) => {
    setCurrentCameraQuestion(question);
    setShowCameraModal(true);
  };

  const validateForm = () => {
    const newErrors = {};
    let firstInvalidField = null;
    questions.forEach((question) => {
      const { questionId, isMandate } = question;
      if (
        isMandate === "1" &&
        !hiddenQuestions.has(questionId) &&
        !answers[questionId]
      ) {
        newErrors[questionId] = "This field is required.";
        if (!firstInvalidField) firstInvalidField = questionId;
      }
    });
    if (firstInvalidField !== null) {
      // Focus the first invalid field
      inputRefs.current[firstInvalidField]?.focus();
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Form submitted successfully:", answers);
      //alert("Form submitted successfully");
      // You can proceed with the form submission logic here, such as sending data to an API
    } else {
      console.log("Form validation failed.");
      //alert("Form validation failed.");
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
                className={`form-control ${
                  errors[questionId] ? "is-invalid" : ""
                }`}
                value={answers[questionId] || ""}
                onChange={(e) => handleInputChange(questionId, e.target.value)}
              >
                {/* <option value="">Select an option</option> */}
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
                    <img
                      src={answers[questionId]}
                      alt="Captured"
                      className="captured-image mb-4"
                    />
                  )}
                  <button
                    onClick={() => openCameraModal(question)}
                    type="button"
                    className="btn btn-outline-success btn-icon-text"
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
                className={`form-control ${
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
                className={`form-control ${
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

  return (
    <Base title="Entry Form">
      <div className="container-fluid page-body-wrapper">
        <div className="main-panel">
          <div className="content-wrapper">
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="row">
                  <div className="col-12 col-xl-8 mb-4 mb-xl-0">
                    <h3 className="font-weight-bold text-capitalize">
                      Welcome,{" "}
                      <span className="text-success">
                        {localStorage.getItem("profileName")}
                      </span>
                    </h3>

                    <h6 className="font-weight-normal mb-0">
                      <span className="text-primary">
                        {localStorage.getItem("username")}
                      </span>
                    </h6>
                  </div>
                  <div className="col-12 col-xl-4">
                    <div className="justify-content-end d-flex">
                      <div className="dropdown flex-md-grow-1 flex-xl-grow-0">
                        <a
                          className="btn btn-sm btn-light bg-white  "
                          type="button"
                          id="dropdownMenuDate2"
                        >
                          Today ({formattedDate})
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12"></div>
            </div>

            {questions && questions.length > 0 ? (
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="row mt-4">
                  {questions.map((question) => renderQuestion(question))}
                </div>
                <div className="">
                  <button
                    className="btn btn-primary mr-2"
                    type="button"
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                </div>

                {showCameraModal && (
                  <div className="modal">
                    <div className="modal-content">
                      <strong className="text-primary">
                        {currentCameraQuestion?.questionName}
                      </strong>
                      <Webcam  audio={false}
    videoConstraints={{
        facingMode: "user", // or "environment" for rear camera
    }}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="webcam"
                      />
                      <br />
                      <div className="row">
                        <div className="col-6">
                          <button style={{width:"100%"}}
                            className="btn btn-outline-dark"
                            onClick={() => setShowCameraModal(false)}
                          >
                            Close
                          </button>
                        </div>
                        <div className="col-6">
                          {" "}
                          <button style={{width:"100%"}}
                            onClick={captureImage}
                            className="btn btn-success btn-icon-text "
                          >
                            <i className="ti-camera btn-icon-prepend"></i>{" "}
                            Capture
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <p>Loading data...</p> // Or display a placeholder message
            )}
          </div>
        </div>
      </div>
    </Base>
  );
}
