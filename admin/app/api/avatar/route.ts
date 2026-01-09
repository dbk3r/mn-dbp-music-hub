import { backendUrl, getBackendToken } from "../_backend"

export async function POST(req: Request) {
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

    const formData = await req.formData()
    const target = backendUrl("/custom/admin/avatar")
    
    const response = await fetch(target, {
      method: "POST",
      headers,
      body: formData,
    })
    
    const text = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"
    
    return new Response(text, { 
      status: response.status, 
      headers: { "Content-Type": contentType } 
    })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ message: "Fehler beim Avatar-Upload", error: String(err) }), 
      { status: 502, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function DELETE(req: Request) {
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

    const target = backendUrl("/custom/admin/avatar")
    
    const response = await fetch(target, {
      method: "DELETE",
      headers,
    })
    
    const text = await response.text()
    const contentType = response.headers.get("content-type") || "application/json"
    
    return new Response(text, { 
      status: response.status, 
      headers: { "Content-Type": contentType } 
    })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ message: "Fehler beim Avatar-Löschen", error: String(err) }), 
      { status: 502, headers: { "Content-Type": "application/json" } }
    )
  }
}
