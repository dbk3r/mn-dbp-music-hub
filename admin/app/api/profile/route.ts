import { backendUrl, getBackendToken } from "../_backend"

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    const token = await getBackendToken()
    const headers: Record<string, string> = {}
    
    // Prefer user token from client over service token
    if (auth) {
      headers.Authorization = auth
    } else if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const target = backendUrl("/custom/admin/profile")
    const response = await fetch(target, { headers })
    
    const text = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"
    
    return new Response(text, { 
      status: response.status, 
      headers: { "Content-Type": contentType } 
    })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ message: "Fehler beim Laden des Profils", error: String(err) }), 
      { status: 502, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    const token = await getBackendToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    
    // Prefer user token from client over service token
    if (auth) {
      headers.Authorization = auth
    } else if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const body = await req.text()
    const target = backendUrl("/custom/admin/profile")
    
    const response = await fetch(target, {
      method: "PATCH",
      headers,
      body,
    })
    
    const text = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"
    
    return new Response(text, { 
      status: response.status, 
      headers: { "Content-Type": contentType } 
    })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ message: "Fehler beim Aktualisieren des Profils", error: String(err) }), 
      { status: 502, headers: { "Content-Type": "application/json" } }
    )
  }
}
