import { useEffect, useState } from 'react'

export default function App() {
  const [health, setHealth] = useState('loading...')

  useEffect(() => {
    fetch('/health')
      .then((r) => r.text())
      .then((t) => setHealth(t))
      .catch((e) => setHealth('failed'))
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Studyroom Frontend</h1>
      <p>Backend /health: {health}</p>
    </div>
  )
}
