import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'AVA_NOT_CONFIGURED', message: 'Ava voice and calls are not connected yet.' },
    { status: 503 },
  )
}
