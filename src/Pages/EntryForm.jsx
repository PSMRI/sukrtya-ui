import React, { useEffect, useRef, useState } from 'react';
import Base from "../Components/Base";
import FormTranslList from "../Data/2.GetFormTranslList.json";
import questions from "../Data/3.GetQuestionDetails.json";
export default function EntryForm() {
  const date = new Date();
  const formattedDate = date
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, " ");

  const userName =
    FormTranslList.objform[0]?.User ||
    FormTranslList.objPrivateUsers[0]?.profileName;
  const profileEmail = FormTranslList.objPrivateUsers[0]?.profileEmail;

  const [answers, setAnswers] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setCameraActive] = useState(false);
  const [isCaptureVisible, setCaptureVisible] = useState(false);

  // Function to start the camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCaptureVisible(true); // Show the capture button
      }
    } catch (error) {
      console.error("Error accessing the camera", error);
    }
  };

  // Function to capture an image from the video
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (video && canvas) {
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/png");
      setImagePreviews((prev) => ({
        ...prev,
        [4]: imageData // Assuming questionId 4 is for Camera
      }));
      setCameraActive(false);
      setCaptureVisible(false); // Hide capture button after taking the picture
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop()); // Stop the video stream
      video.srcObject = null; // Clear the video source
    }
  };

  // Cleanup function to stop the camera on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);


  const handleInputChange = (questionId, value) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };
  



  const renderQuestion = (question) => {
    const { questionId, questionName, questionType, QuestionOptions,isMandate,maxvalue,minvalue } =
      question;

    switch (questionType) {
      case "Single Choice":
        return (
          <div className="col-md-6 col-lx-6" key={questionId}>
            <div className="form-group">
              <label>{questionName} {isMandate === "1" && <span style={{ color: 'red', marginLeft: '5px' }}>*</span>}</label>
              <select
                className="form-control"
                value={answers[questionId] || ""}
                onChange={(e) => handleInputChange(questionId, e.target.value)}
              >
                <option value="">Select an option</option>
                {QuestionOptions.map((option) => (
                  <option key={option.Value} value={option.Value}>
                    {option.Text}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case "Camera":
        return (
          <div className="col-md-6 col-lx-6" key={questionId}>
            <div className="form-group">
            <div>
            {isCameraActive ? (
              <>
                <video ref={videoRef} autoPlay style={{ width: '100%', height: 'auto', borderRadius: '5px' }} />
                {isCaptureVisible && (
                  <button type="button" className="btn btn-outline-success btn-icon-text" onClick={captureImage}> <i class="ti-camera btn-icon-prepend"></i> Capture Image</button>
                )}
              </>
            ) : (
              <button type="button"  className="btn btn-outline-success btn-icon-text" onClick={startCamera}> <i class="ti-camera btn-icon-prepend"></i> Open Camera</button>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} width={640} height={480}></canvas>
            {imagePreviews[questionId] && (
              <img
                src={imagePreviews[questionId]}
                alt="Captured"
                style={{ width: '200px', marginTop: '10px', borderRadius: '5px' }}
              />
            )}
          </div>
            </div>
          </div>
        );

      case "Numeric":
        return (
          <div className="col-md-6 col-lx-6" key={questionId}>
            <div className="form-group">
              <label>{questionName} {isMandate === "1" && <span style={{ color: 'red', marginLeft: '5px' }}>*</span>}</label>
              <input
                type="number"   min={minvalue}
                max={maxvalue}
                className="form-control" placeholder="0"
                value={answers[questionId] || ""}
                onChange={(e) => handleInputChange(questionId, e.target.value)}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="col-md-6 col-lx-6" key={questionId}>
            {" "}
            <div className="form-group">
              <label>{questionName} {isMandate === "1" && <span style={{ color: 'red', marginLeft: '5px' }}>*</span>}</label>
              <input
                type="text"  placeholder="type here.." maxLength={maxvalue}
                className="form-control"
                value={answers[questionId] || ""}
                onChange={(e) => handleInputChange(questionId, e.target.value)}
              />
            </div>{" "}
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
                      Welcome {userName}
                    </h3>

                    <h6 className="font-weight-normal mb-0">
                      <span className="text-primary">{profileEmail}</span>
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
              <div className="col-md-12">
                <h5 className="mb-0 text-primary">
                  <img
                    src="https://aphcsukrtya.shsbihar.in/facilityicon.png"
                    alt="image"
                    style={{ height: "30px" }}
                  />{" "}
                  State : BIHAR || District : KATIHAR || Block : KADWA ||
                  Facility Name : APHC MAHINAGAR
                </h5>
              </div>
            </div>
            <form>
              <div className="row mt-4">
                {questions.sort((a, b) => a.questionId - b.questionId)
                .map((question) => renderQuestion(question))}
              </div>
              <div className="">
                <button
                  className="btn btn-primary mr-2"
                  type="button"
                  onClick={() => console.log(answers)}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Base>
  );
}
