export async function POST() {
  return Response.json({ error: 'Phone calling is not configured. Use Ava text chat in your workspace.' }, { status: 503 })
}
