"use client"

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Copy } from 'lucide-react'

export default function Login() {
  const [ deviceCode, setDeviceCode] = useState('')
  const [userCode, setUserCode] = useState('')
  const [verificationUri, setVerificationUri] = useState('')
  const [loading, setLoading] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [isPolling, setIsPolling] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers or HTTP
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getDeviceCode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/device-code', {
        method: 'POST',
      })

      const data = await response.json()
      if (data.device_code) {
        setDeviceCode(data.device_code)
        setUserCode(data.user_code)
        setVerificationUri(data.verification_uri)
        
        window.open(data.verification_uri, '_blank')
        
        // Start polling for token
        setIsPolling(true)
        pollForToken(data.device_code)
      }
    } catch (error) {
      console.error('Error getting device code:', error)
    } finally {
      setLoading(false)
    }
  }

  const pollForToken = async (deviceCode: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ device_code: deviceCode })
        })

        const data = await response.json()
        
        if (data.access_token) {
          setAccessToken(data.access_token)
          setIsPolling(false)
          clearInterval(interval)
          console.log('Login successful!', data)
          // Store access token in localStorage
          localStorage.setItem('access_token', data.access_token)
          window.location.href = '/pages/dashboard'
        } else if (data.error && data.error !== 'authorization_pending') {
          console.error('Login error:', data.error_description)
          setIsPolling(false)
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Polling error:', error)
        setIsPolling(false)
        clearInterval(interval)
      }
    }, 5000)

    setTimeout(() => {
      clearInterval(interval)
      setIsPolling(false)
    }, 600000)
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4 space-y-4">
      <Label className="mt-4 text-center text-2xl font-bold">
        Login with Microsoft
      </Label>
      <div className="flex items-center justify-center gap-4">
        <Button onClick={getDeviceCode} disabled={loading || isPolling}>
          {loading ? 'Getting code...' : userCode ? userCode : 'Get Device Code'}
        </Button>
        {userCode && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => copyToClipboard(userCode)}
            className="px-2"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
      <Label className="mt-4 text-center">
        {userCode ? 'Copy the code to be used for login' : 'Click the button to get your device code, then follow the instructions.'}
      </Label>
    </div>
  )
}