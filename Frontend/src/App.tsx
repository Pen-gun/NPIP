import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FigureSearchPage from './pages/FigureSearchPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/search' element={<FigureSearchPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route
          path='/app'
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </Layout>
  )
}
