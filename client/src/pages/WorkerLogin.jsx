import PanelLogin from './PanelLogin'

export default function WorkerLogin() {
  return <PanelLogin portal="worker" expectedRoles={['worker']} />
}
