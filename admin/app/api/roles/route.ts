import { backendUrl, getBackendToken } from "../_backend"

export async function GET(req: Request) {
  try {
    const token = await getBackendToken()
    const auth = req.headers.get("authorization")
    const headers: Record<string, string> = {}
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    } else if (auth) {
      headers.Authorization = auth
    }

    const target = backendUrl("/custom/admin/roles")
    const response = await fetch(target, { headers })
    
    const text = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"
    
    return new Response(text, { 
      status: response.status, 
      headers: { "Content-Type": contentType } 
    })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ message: "Fehler beim Laden der Rollen", error: String(err) }), 
      { status: 502, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const token = await getBackendToken()
    const auth = req.headers.get("authorization")
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    } else if (auth) {
      headers.Authorization = auth
    }

    const body = await req.text()
    const target = backendUrl("/custom/admin/roles")
    
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
      JSON.stringify({ message: "Fehler beim Aktualisieren der Rolle", error: String(err) }), 
      { status: 502, headers: { "Content-Type": "application/json" } }
    )
  }
}
