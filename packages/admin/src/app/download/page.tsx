'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DownloadPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/mobile')
  }, [router])

  return null
}
