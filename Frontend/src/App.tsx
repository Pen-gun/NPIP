import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const FigureSearchPage = lazy(() => import('./pages/FigureSearchPage'))

export default function App() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className='flex min-h-screen items-center justify-center text-sm text-(--text-muted)'>
            Loading...
          </div>
        }
      >
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
      </Suspense>
    </Layout>
  )
}
