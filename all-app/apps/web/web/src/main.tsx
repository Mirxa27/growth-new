import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import VoiceAgent from './routes/VoiceAgent'
import Assessments from './routes/Assessments'
import RunAssessment from './routes/RunAssessment'
import Admin from './routes/Admin'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/voice', element: <VoiceAgent /> },
  { path: '/assessments', element: <Assessments /> },
  { path: '/run', element: <RunAssessment /> },
  { path: '/admin', element: <Admin /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
