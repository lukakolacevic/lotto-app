import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain="comperio-app.eu.auth0.com"
      clientId="8RZ0oUKo9fqTlCQhfYUvFrsi4J0amBeA"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://lotto-api",
        scope: 'openid profile email'
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);
