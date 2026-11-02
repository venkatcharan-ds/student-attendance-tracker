import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </ConfirmProvider>
    </ToastProvider>
  </React.StrictMode>,
)
