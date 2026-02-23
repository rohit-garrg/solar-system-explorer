// No StrictMode — React 18/19 StrictMode double-invokes effects,
// which creates Three.js resources twice and causes memory leaks.
// This is a known React Three Fiber issue.
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
