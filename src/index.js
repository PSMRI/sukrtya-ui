import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';
import { createRoot } from 'react-dom/client';
import App from './App';
import axios from 'axios';
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import FacilityTrans from "./Pages/FacilityTrans";
import ForgotPassword from "./Pages/ForgotPassword.jsx";
import EntryForm from "./Pages/EntryForm";
import ChangePassword from "./Pages/ChangePassword";
import Profile from "./Pages/Profile";

// Set axios default baseURL from environment variable
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8084';

// Optional: Set other defaults, like headers
//axios.defaults.headers.common['Authorization'] = 'Bearer your_token_if_any';
//axios.defaults.headers.post['Content-Type'] = 'application/json';
//axios.defaults.withCredentials = true;

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Login /> },
      { path: "login", element: <Login /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "facility-trans", element: <FacilityTrans /> },
      { path: "entry-form", element: <EntryForm /> },
      { path: "profile", element: <Profile /> },
      { path: "change-password", element: <ChangePassword /> }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

 
