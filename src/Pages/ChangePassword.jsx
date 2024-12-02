import React from 'react'
import Base from '../Components/Base'

export default function ChangePassword() {
    return (
        <Base title="Change Password">
            <div class="main-panel">
                <div class="content-wrapper">
                    <div class="row">
                        <div className='col-md-4'></div>
                        <div class="col-md-4 grid-margin stretch-card mt-5">
                            <div class="card">
                                <div class="card-body">
                                    <h4 class="card-title">Change Password</h4>
                                    <p class="card-description">

                                    </p>

                                    <div class="form-group">
                                        <label>Old Password</label>
                                        <input type="password" class="form-control form-control-sm" placeholder="old password" aria-label="Username" />
                                    </div>
                                    <div class="form-group">
                                        <label>New Password</label>
                                        <input type="password" class="form-control form-control-sm" placeholder="new password" aria-label="Username" />
                                    </div>
                                    <div class="form-group">
                                        <label>Re-Type New Password</label>
                                        <input type="password" class="form-control form-control-sm" placeholder="re-type new password" aria-label="Username" />
                                    </div>
                                    <button type="submit" class="btn btn-primary mr-2" style={{width: "100%"}}>Change Password</button>
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
