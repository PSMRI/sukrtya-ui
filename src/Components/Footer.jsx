import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <>
     <footer className="footer">
              <div className="d-sm-flex justify-content-center justify-content-sm-between">
                <span className="text-muted text-center text-sm-left d-block d-sm-inline-block" title='04032025080250PM'>
                  Copyright © 2025. All rights reserved.
                </span>
                <span className="text-muted text-center text-sm-left d-block d-sm-inline-block">
                  Design & Developed by{" "}
                  <Link to="https://www.piramalswasthya.org/" target="_blank">
                    Piramalswasthya
                  </Link>
                </span>
              </div>
              <div className="d-sm-flex justify-content-center justify-content-sm-between"></div>
            </footer>
    </>
  )
}
