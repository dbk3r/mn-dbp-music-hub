export default function CartPopup({cart, onClose, onCheckout}) {
  return (
    <div style={{
      position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.4)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:10000
    }}>
      <div style={{background:"#fff",padding:30,borderRadius:12,minWidth:340}}>
        <h2>Warenkorb</h2>
        {cart.length === 0
          ? <p>Ihr Warenkorb ist leer.</p>
          :(<ul>{cart.map((i,k)=>
            <li key={k}>{i.title} ({i.licenseModelName}) – {i.price}€</li>
          )}</ul>)
        }
        <div style={{marginTop:20}}>
          <button disabled={!cart.length} onClick={onCheckout}>Zur Kasse</button>
          <button onClick={onClose} style={{marginLeft:10}}>Schließen</button>
        </div>
      </div>
    </div>
  )
}