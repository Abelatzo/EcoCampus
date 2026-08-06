import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Login from './Login'
import Register from './Register'
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'
import MapView from './MapView'
import Reports from './Reports'
import AdminReports from './AdminReports'
import AdminMapView from './AdminMapView'
import Events from './Events'
import AdminEvents from './AdminEvents'
import AdminUsers from './AdminUsers'
import AdminPanel from './AdminPanel'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/events" element={<Events />} />
        <Route path="/admin" element={<AdminMapView />} />
        <Route path="/admin/map" element={<AdminMapView />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
        <Route path="/adminreports" element={<AdminReports />} />
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
