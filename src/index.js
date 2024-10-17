import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from 'react-query';
 


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
  <QueryClientProvider  client={queryClient}>
    <App />
  </QueryClientProvider>

  , rootNode);

 