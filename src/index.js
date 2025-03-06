import React from 'react';
import { BrowserRouter } from "react-router-dom";
import './index.css';
import ReactDOM from "react-dom";
import App from './App';
 
import axios from 'axios';

// Set the base URL
axios.defaults.baseURL = 'https://api.sukrtya.in';
//axios.defaults.baseURL = 'https://sukrtya.api.nitag.in';
//axios.defaults.baseURL = 'http://localhost:8080';

// Optional: Set other defaults, like headers
//axios.defaults.headers.common['Authorization'] = 'Bearer your_token_if_any';
//axios.defaults.headers.post['Content-Type'] = 'application/json';
//axios.defaults.withCredentials = true;
 
 

 
 
const rootNode = document.getElementById('root');
ReactDOM.render(
  <BrowserRouter>
    
    <App />

  </BrowserRouter>
  , rootNode);

 