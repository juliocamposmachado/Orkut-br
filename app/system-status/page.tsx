import { Metadata } from 'next'
import SystemStatusDashboard from '@/components/SystemStatusDashboard'

export const metadata: Metadata = {
  title: 'Status do Sistema - Orkut',
  description: 'Monitoramento em tempo real do status do sistema Orkut, bugs detectados e performance de deployments',
  keywords: 'orkut, status, sistema, bugs, monitoramento, dashboard, deploy, performance'
}

export default function SystemStatusPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <SystemStatusDashboard />
    </div>
  )
}
