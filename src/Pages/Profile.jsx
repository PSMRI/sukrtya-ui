import React from 'react'
import Base from '../Components/Base'

export default function Profile() {
  return (
    <Base title="Profile">
    <div class="main-panel">
                <div class="content-wrapper">
                    <div class="row">
                        <div className='col-md-4'></div>
                        <div class="col-md-4 grid-margin stretch-card mt-5">
                            <div class="card">
                                <div class="card-body">
                                    <h4 class="card-title">User Profile</h4>
                                    <p class="card-description">

                                    </p>

                                    <div class="form-group">
                                        <label>Profile Name</label>
                                        <input type="text" disabled class="form-control form-control-sm" placeholder="Deepak Kumar (BHM)" aria-label="Username" />
                                    </div>
                                    <div class="form-group">
                                        <label>User Type</label>
                                        <input type="text" disabled class="form-control form-control-sm" placeholder="BHM" aria-label="Username" />
                                    </div>
                                    <div class="form-group">
                                        <label>Address</label>
                                        <input type="text" disabled class="form-control form-control-sm" placeholder="Patna" aria-label="Username" />
                                    </div>
                                    <button type="submit" disabled class="btn btn-primary mr-2" style={{width: "100%"}}>Update Profile</button>
                                </div>
                            </div>
                        </div>
                        <div className='col-md-4'></div>
                    </div>
                </div>
            </div>
    </Base>
  )
}
