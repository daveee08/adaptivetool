import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { device_code } = await request.json()
    
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
        device_code: device_code,
      })
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error polling for token:', error)
    return NextResponse.json({ error: 'Failed to poll for token' }, { status: 500 })
  }
}
