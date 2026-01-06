import { getBackendToken } from "../_backend"

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export async function GET() {
  try {
    const token = await getBackendToken()
    if (token) return jsonResponse({ available: true })
    return jsonResponse({ available: false }, 401)
  } catch (err: any) {
    return jsonResponse({ available: false, error: String(err) }, 500)
  }
}
