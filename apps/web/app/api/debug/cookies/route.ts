import { NextResponse, type NextRequest } from 'next/server'

function parseCookieNames(cookieHeader: string | null): string[] {
  if (!cookieHeader) return []
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split('=')[0] || '')
    .filter(Boolean)
}

export async function GET(request: NextRequest) {
  const headers = request.headers
  const host = headers.get('host') || ''
  const forwardedProto = headers.get('x-forwarded-proto')
  const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : request.nextUrl.protocol.replace(':', '')
  const cookieHeader = headers.get('cookie')
  const cookieNames = parseCookieNames(cookieHeader)
  const sbCookieNames = cookieNames.filter((name) => name.startsWith('sb-'))

  return NextResponse.json({
    host,
    protocol,
    cookieHeaderPresent: Boolean(cookieHeader && cookieHeader.trim().length > 0),
    cookieNames,
    sbCookieNames,
  })
}
