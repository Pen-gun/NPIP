import Navbar from '../Navbar'

interface DashboardHeaderProps {
  userName?: string
  onLogout: () => void
}

export default function DashboardHeader({ userName, onLogout }: DashboardHeaderProps) {
  return <Navbar links={[]} userName={userName} onLogout={onLogout} showAuth={false} />
}
