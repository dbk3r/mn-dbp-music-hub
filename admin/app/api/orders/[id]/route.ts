import { backendUrl, getBackendToken } from "../../_backend"

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

async function proxy(method: string, id: string, req: Request) {
  const qs = new URL(req.url).search
  const targets = [
    backendUrl(`/custom/admin/orders/${id}${qs}`),
    backendUrl(`/admin/orders/${id}${qs}`),
    backendUrl(`/orders/${id}${qs}`),
  ]

  const callerAuth = req.headers.get("authorization")
  const token = await getBackendToken()

  // read request body once (stream can only be read once) and reuse for retries
  let bodyText: string | undefined = undefined
  if (method !== "GET" && method !== "HEAD") {
    try {
      bodyText = await req.text()
    } catch (e) {
      bodyText = undefined
    }
  }

  for (const t of targets) {
    try {
      console.log('[admin-api] trying target', t, { method })
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      else if (callerAuth) headers.Authorization = callerAuth
      if (req.headers.get("content-type")) headers["content-type"] = req.headers.get("content-type") as string

      const init: any = { method, headers }
      if (bodyText !== undefined) init.body = bodyText

      let r: Response
      try {
        r = await fetch(t, init)
      } catch (err) {
        console.log('[admin-api] fetch error for target', t, String(err))
        continue
      }
      console.log('[admin-api] got response', { url: t, status: r.status })
      if (r.status === 404) {
        console.log('[admin-api] target returned 404, trying next')
        continue
      }
      // If unauthorized and we have a token, retry with token
      if (r.status === 401 && callerAuth && token) {
        console.log('[admin-api] got 401, retrying with server token for', t)
        const r2 = await fetch(t, { ...init, headers: { ...headers, Authorization: `Bearer ${token}` } })
        console.log('[admin-api] retry response', { url: t, status: r2.status })
        if (r2.status >= 200 && r2.status < 300) return r2
        continue
      }
      if (r.status >= 200 && r.status < 300) return r
      // non-2xx (but not 401/404) -> try next target
      console.log('[admin-api] non-2xx response, trying next target', { url: t, status: r.status })
      continue
    } catch (e) {
      console.log('[admin-api] unexpected error when proxying to', t, String(e))
      continue
    }
  }

  return null
}

export async function PATCH(req: Request, context: any) {
  const params = await context.params
  let id = params?.id
  if (!id) {
    try {
      const url = new URL(req.url)
      const parts = url.pathname.split("/").filter(Boolean)
      id = parts[parts.length - 1]
      console.log('[admin-api][orders/:id] parsed id from url', id)
    } catch (e) {
      // ignore
    }
  }
  if (!id) return jsonResponse({ message: "missing id" }, 400)
  // normalize id: backend expects raw numeric id (strip any leading 'order_' prefixes)
  const backendId = String(id).replace(/^(?:order_)+/, '')
  console.log('[admin-api] proxying PATCH for', { id, backendId })
  const r = await proxy("PATCH", backendId, req)
  if (!r) return jsonResponse({ message: "Backend unreachable" }, 502)
  const text = await r.text()
  const ct = r.headers.get("content-type") || "application/json"
  return new Response(text, { status: r.status, headers: { "Content-Type": ct } })
}

export async function DELETE(req: Request, context: any) {
  const params = await context.params
  let id = params?.id
  if (!id) {
    try {
      const url = new URL(req.url)
      const parts = url.pathname.split("/").filter(Boolean)
      id = parts[parts.length - 1]
      console.log('[admin-api][orders/:id] parsed id from url (delete)', id)
    } catch (e) {
      // ignore
    }
  }
  if (!id) return jsonResponse({ message: "missing id" }, 400)
  const backendId = String(id).replace(/^(?:order_)+/, '')
  console.log('[admin-api] proxying DELETE for', { id, backendId })
  const r = await proxy("DELETE", backendId, req)
  if (!r) return jsonResponse({ message: "Backend unreachable" }, 502)
  const text = await r.text()
  const ct = r.headers.get("content-type") || "application/json"
  return new Response(text, { status: r.status, headers: { "Content-Type": ct } })
}
