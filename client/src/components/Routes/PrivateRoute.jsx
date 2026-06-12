import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import ElectricLoader from '../ElectricLoader'

export default function PrivateRoute({ children, roles, role }) {
  const user = useAuthStore((state) => state.user)
  const authReady = useAuthStore((state) => state.authReady)
  const location = useLocation()
  const allowedRoles = roles || (role ? [role] : null)

  if (!authReady) {
    return <ElectricLoader compact />
  }

  if (!user) {
    const loginPath = allowedRoles?.some((item) => ['admin', 'superadmin'].includes(item))
      ? '/admin/login'
      : allowedRoles?.includes('worker')
        ? '/worker/login'
        : '/login'
    return <Navigate to={`${loginPath}?returnUrl=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (user.isActive === false || user.status === 'suspended') {
    return <Navigate to="/account-suspended" replace />
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin' || user.role === 'superadmin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (user.role === 'worker') {
      return <Navigate to="/worker/dashboard" replace />
    }
    return <Navigate to="/" replace />
  }

  return children || <Outlet />
}
