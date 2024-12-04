import React from 'react';
import { BrowserRouter } from "react-router-dom";
import './index.css';
import ReactDOM from "react-dom";
import App from './App';
import { QueryClient, QueryClientProvider } from 'react-query';
import axios from 'axios';

// Set the base URL
axios.defaults.baseURL = 'https://render-2m63.onrender.com';
//axios.defaults.baseURL = 'http://localhost:8080';

// Optional: Set other defaults, like headers
//axios.defaults.headers.common['Authorization'] = 'Bearer your_token_if_any';
//axios.defaults.headers.post['Content-Type'] = 'application/json';
//axios.defaults.withCredentials = true;

window.globalConfigs = (function () {
  var getConfig = function (key) {
  }
  return {
    getConfig
  }
}())
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000,
      cacheTime: 50 * 60 * 1000,
      retry: false,
      retryDelay: (attemptIndex) => Infinity
    }
  }
})

 
 
const rootNode = document.getElementById('root');
ReactDOM.render(
  <BrowserRouter>
    <QueryClientProvider  client={queryClient}>
    <App />
  </QueryClientProvider>
  </BrowserRouter>
  , rootNode);

 