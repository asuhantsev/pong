import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/base/reset.module.css'
import { App } from './App'

// This creates the root of our app and renders it
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

