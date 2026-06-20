import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './index.css'
import { AuthProvider, DataProvider, ToastProvider, useAuth } from './context/app'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Appointments from './pages/Appointments'
import Patients from './pages/Patients'
import PatientProfile from './pages/PatientProfile'
import Assessment from './pages/Assessment'
import HEP from './pages/HEP'
import Symptoms from './pages/Symptoms'
import ACL from './pages/ACL'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'
import Portal from './pages/Portal'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="h-full flex items-center justify-center text-ink-3 text-sm">Loading MuscleMind…</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/welcome" element={<RequireAuth><Onboarding /></RequireAuth>} />
      <Route path="/p/:token" element={<Portal />} />
      <Route path="/app" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientProfile />} />
        <Route path="assessment" element={<Assessment />} />
        <Route path="exercises" element={<HEP />} />
        <Route path="symptoms" element={<Symptoms />} />
        <Route path="acl" element={<ACL />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  </React.StrictMode>,
)
