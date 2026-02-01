import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const FigureSearchPage = lazy(() => import('./pages/FigureSearchPage'))
const AdminCMSPage = lazy(() => import('./pages/AdminCMSPage'))
const CmsPage = lazy(() => import('./pages/CmsPage'))

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
          <Route path='/' element={<CmsPage slug='home' fallback={<LandingPage />} />} />
          <Route path='/search' element={<FigureSearchPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/reset-password' element={<ResetPasswordPage />} />
          <Route
            path='/app'
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/cms'
            element={
              <ProtectedAdminRoute>
                <AdminCMSPage />
              </ProtectedAdminRoute>
            }
          />
          <Route path='/:slug' element={<CmsPage />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
