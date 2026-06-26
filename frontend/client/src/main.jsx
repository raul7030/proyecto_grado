import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LayoutProvider } from './context/LayoutContext'
import App from './App.jsx'
import './index.css' // Estilos globales
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      {/* 1. ENVOLVER PRIMERO EN LAYOUT PROVIDER */}
      <LayoutProvider>
        {/* 2. ENVOLVER EN AUTH PROVIDER */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </LayoutProvider>
    </Router>
  </React.StrictMode>,
)