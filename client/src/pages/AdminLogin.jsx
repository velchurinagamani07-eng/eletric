import Login from './Login'

export default function AdminLogin() {
  return <Login portal="admin" expectedRoles={['admin', 'superadmin']} allowGoogle={false} />
}
