import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css' // تأكيد المسار

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'white', padding: 20, background: '#1a1a1a' }}>
          <h2>خطأ في التطبيق</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
} else {
  document.body.innerHTML = '<div style="color:white;padding:20px;">Root not found</div>'
}
