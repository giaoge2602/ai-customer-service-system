import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import './admin.css'
import './polish.css'
import './admin-polish.css'
import './auth.css'
import './prototype.css'
import './dashboard.css'
import './approval.css'
import './logs.css'
import './customer-center.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
