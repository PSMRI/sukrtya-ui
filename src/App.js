import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import FacilityTrans from "./Pages/FacilityTrans"

import "./App.css";
import { Routes, Route } from "react-router-dom";
import React from "react";
import EntryForm from "./Pages/EntryForm";

function App() {
  return (
    <>
      <Routes>
        <Route exact path="/" element={<Login />} />
        <Route exact path="/login" element={<Login />} />
        <Route exact path="/dashboard" element={<Dashboard />} />
        <Route exact path="/facility-trans" element={<FacilityTrans />} />
        <Route exact path="/entry-form" element={<EntryForm />} />
        
      </Routes>
    </>
  );
}

export default App;
