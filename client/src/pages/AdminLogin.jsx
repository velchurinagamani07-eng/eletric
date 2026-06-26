import PanelLogin from './PanelLogin'

export default function AdminLogin() {
  return <PanelLogin portal="admin" expectedRoles={['admin', 'superadmin']} />
}
