import React, { useEffect, useState } from 'react'
import Base from '../Components/Base'
import axios from 'axios';

export default function Profile() {
  const [labels, setLabels] = useState({});
  useEffect(() => {
    const fetchLabel = async () => {
      try {
        const labelResponse = await axios.get(
          `sukrtya/api/language-labels/getLabels?formId=5&regLId=${localStorage.getItem("language")}`
        );
        setLabels(labelResponse.data[0]); // Assuming response is an array with labels as key-value pairs
      } catch (error) {
        console.error("Error fetching labels:", error);
      }
    };
    fetchLabel();
  }, []);
  return (
    <Base title="Profile">
      <div className="main-panel">
        <div className="content-wrapper">
          <div className="row">
            <div className='col-md-4'></div>
            <div className="col-md-4 grid-margin stretch-card mt-5">
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">{labels[23] || "User Profile"}</h4>
                  <p className="card-description">

                  </p>

                  <div className="form-group">
                    <label>{labels[1] || "Profile Name"}</label>
                    <input type="text" disabled className="form-control form-control-sm" placeholder="Deepak Kumar (BHM)" aria-label="Username" />
                  </div>
                  <div className="form-group">
                    <label>{labels[3] || "User Type"}</label>
                    <input type="text" disabled className="form-control form-control-sm" placeholder="BHM" aria-label="Username" />
                  </div>
                  <div className="form-group">
                    <label>{labels[9] || "Address"}</label>
                    <input type="text" disabled className="form-control form-control-sm" placeholder="Patna" aria-label="Username" />
                  </div>
                  {/* <button type="submit" disabled className="btn btn-primary mr-2" style={{ width: "100%" }}>{labels[22] || "Update Profile"}</button> */}
                </div>
              </div>
            </div>
            <div className='col-md-4'></div>
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
  )
}
