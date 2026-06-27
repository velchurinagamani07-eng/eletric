import { useLocation } from 'react-router-dom'
import CallButton from './CallButton'
import ChatbotWidget from './ChatbotWidget'
import WhatsAppButton from './WhatsAppButton'

export default function FloatingButtons() {
  const location = useLocation()
  const isServiceDetailPage = location.pathname.startsWith('/service/')

  if (isServiceDetailPage) {
    return null
  }

  return (
    <>
      <WhatsAppButton />
      <CallButton />
      <ChatbotWidget />
    </>
  )
}

