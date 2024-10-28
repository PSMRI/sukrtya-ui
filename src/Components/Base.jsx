import React from "react";
import NavBar from "./NavBar";
import Footer from "./Footer";

export default function Base({ title = "Welcome", children }) {
  document.title = title;

  return (
    <>
      <div className="container-scroller">
        <NavBar />

        {children}
        <Footer />
      </div>
    </>
  );
}
