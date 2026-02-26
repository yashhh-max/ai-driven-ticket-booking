import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({ status: 'ok', message: 'Test endpoint working' })
}

export function POST() {
  return NextResponse.json({ status: 'ok', message: 'Test endpoint working' })
}
