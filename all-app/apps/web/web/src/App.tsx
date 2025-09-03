import { Link } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <main className="app">
      <h1>All-App</h1>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link to="/assessments">Free Assessments</Link>
        <Link to="/voice">Voice Agent</Link>
      </nav>
      <p>Welcome. Explore assessments or try the voice agent.</p>
    </main>
  )
}

export default App
