import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import EmployeeList from './pages/EmployeeList'
import EmployeeForm from './pages/EmployeeForm'
import EmployeeProfile from './pages/EmployeeProfile'
import RetirementAlert from './pages/RetirementAlert'
import AttendanceReport from './pages/AttendanceReport'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/new" element={
              <ProtectedRoute>
                <EmployeeForm />
              </ProtectedRoute>
            } />
            <Route path="/employees/:id/edit" element={
              <ProtectedRoute>
                <EmployeeForm />
              </ProtectedRoute>
            } />
            <Route path="/employees/:id" element={<EmployeeProfile />} />
            <Route path="/retirement-alert" element={<RetirementAlert />} />
            <Route path="/attendance-report" element={<AttendanceReport />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
