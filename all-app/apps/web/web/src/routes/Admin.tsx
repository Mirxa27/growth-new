import { useState } from 'react'

export default function Admin() {
  const [topic, setTopic] = useState('Photosynthesis')
  const [model, setModel] = useState('gpt-4o-mini')
  const [types, setTypes] = useState<string[]>(['assessment', 'course'])
  const [result, setResult] = useState<any>(null)

  const toggle = (t: string) => {
    setTypes((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]))
  }

  const generate = async () => {
    const resp = await fetch('/api/ai-builder/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, model, productTypes: types }),
    })
    const data = await resp.json()
    setResult(data)
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Admin: AI Builder</h1>
      <div style={{ display: 'grid', gap: 8, maxWidth: 600 }}>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" />
        <div>
          {['test', 'assessment', 'exploration', 'course'].map((t) => (
            <label key={t} style={{ marginRight: 12 }}>
              <input type="checkbox" checked={types.includes(t)} onChange={() => toggle(t)} /> {t}
            </label>
          ))}
        </div>
        <button onClick={generate}>Generate</button>
      </div>
      {result && (
        <pre style={{ marginTop: 16, background: '#111', color: '#fff', padding: 12, overflow: 'auto' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  )
}

