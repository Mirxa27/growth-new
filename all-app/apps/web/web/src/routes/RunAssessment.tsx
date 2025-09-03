import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function RunAssessment() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/content/assessments?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message))
  }, [id])

  if (!id) return <p>Missing assessment id</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (!data) return <p>Loading...</p>

  return (
    <main style={{ padding: 24 }}>
      <h1>{data?.title || 'Assessment'}</h1>
      <p>Type: {data?.type}</p>
      <section>
        <p>Questions will render here...</p>
      </section>
    </main>
  )
}