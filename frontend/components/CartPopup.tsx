type CartItem = {
  audioId?: number
  title?: string
  licenseModelName?: string
  priceCents?: number
}

type CartPopupProps = {
  cart: CartItem[]
  onClose: () => void
  onCheckout: () => void
  checkoutStatus?: "idle" | "loading" | "success" | "error"
  checkoutTotalCents?: number
}

export default function CartPopup({
  cart,
  onClose,
  onCheckout,
  checkoutStatus = "idle",
  checkoutTotalCents,
}: CartPopupProps) {
  function fmtPrice(cents: number | undefined) {
    if (typeof cents !== "number" || !Number.isFinite(cents)) return "–"
    return (cents / 100).toFixed(2)
  }

  const isLoading = checkoutStatus === "loading"
  const isSuccess = checkoutStatus === "success"
  const isError = checkoutStatus === "error"

  return (
    <div style={{
      position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:10000
    }}>
      <div style={{background:"#fff",padding:30,borderRadius:12,minWidth:340}}>
        <h2>Warenkorb</h2>

        {isLoading && (
          <div style={{ margin: "10px 0", color: "#666" }}>Checkout läuft…</div>
        )}
        {isSuccess && (
          <div style={{ margin: "10px 0", color: "#1f7a1f", fontWeight: 600 }}>
            Bestellung angefragt. Summe: {fmtPrice(checkoutTotalCents)}€
          </div>
        )}
        {isError && (
          <div style={{ margin: "10px 0", color: "#b00020", fontWeight: 600 }}>
            Checkout fehlgeschlagen.
          </div>
        )}

        {cart.length === 0
          ? <p>Ihr Warenkorb ist leer.</p>
          :(<ul>{cart.map((i, k) =>
            <li key={k}>{i.title} ({i.licenseModelName}) – {fmtPrice(i.priceCents)}€</li>
          )}</ul>)
        }
        <div style={{marginTop:20}}>
          <button disabled={!cart.length || isLoading} onClick={onCheckout}>Zur Kasse</button>
          <button onClick={onClose} style={{marginLeft:10}} disabled={isLoading}>Schließen</button>
        </div>
      </div>
    </div>
  )
}