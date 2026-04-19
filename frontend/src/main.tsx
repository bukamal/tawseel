import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  document.body.innerHTML = '<div style="color:white;padding:20px;">Error: Root element not found</div>'
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
