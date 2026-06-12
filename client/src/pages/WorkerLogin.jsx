import Login from './Login'

export default function WorkerLogin() {
  return <Login portal="worker" expectedRoles={['worker']} allowGoogle={false} />
}
