import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ 
      color: 'white', 
      background: '#007AFF', 
      padding: '40px', 
      textAlign: 'center',
      fontFamily: 'sans-serif',
      height: '100vh'
    }}>
      <h1>🚀 Tawseel App Loaded!</h1>
      <p>If you see this, the app is working.</p>
      <button 
        onClick={() => setCount(c => c + 1)}
        style={{ padding: 10, fontSize: 18, marginTop: 20 }}
      >
        Clicked {count} times
      </button>
    </div>
  )
}

export default App
