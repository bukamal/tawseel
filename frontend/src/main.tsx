import React from 'react'
import ReactDOM from 'react-dom/client'

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <div style={{ 
      color: 'white', 
      background: '#007AFF', 
      padding: '40px', 
      textAlign: 'center',
      fontFamily: 'sans-serif',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <h1>✅ Tawseel Frontend يعمل!</h1>
      <p>إذا كنت ترى هذه الرسالة، فالمشكلة في كود التطبيق وليس في Vite أو Cloudflare.</p>
    </div>
  )
} else {
  document.body.innerHTML = '<div style="color:white;padding:20px;">Error: Root element not found</div>'
}
