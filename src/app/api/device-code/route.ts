import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/devicecode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
        scope: 'https://graph.microsoft.com/Team.ReadBasic.All https://graph.microsoft.com/User.Read https://graph.microsoft.com/Channel.ReadBasic.All https://graph.microsoft.com/ChannelMessage.Read.All https://graph.microsoft.com/Group.ReadWrite.All https://graph.microsoft.com/EduAssignments.Read https://graph.microsoft.com/EduRoster.Read https://graph.microsoft.com/EduAdministration.Read https://graph.microsoft.com/EduCurricula.Read'
      })
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error getting device code:', error)
    return NextResponse.json({ error: 'Failed to get device code' }, { status: 500 })
  }
}
