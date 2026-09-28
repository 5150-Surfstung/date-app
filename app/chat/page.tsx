import { Suspense } from 'react'
import ChatClient from './chat-client'

export const metadata = { title: '/date — /chat' }

export default function ChatPage() {
  return (
    <Suspense>
      <ChatClient />
    </Suspense>
  )
}
