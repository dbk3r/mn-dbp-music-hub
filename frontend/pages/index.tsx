import React, {useState} from "react"
import HeaderMenu from "../components/HeaderMenu"
import SearchBar from "../components/SearchBar"
import AudioResultCard from "../components/AudioResultCard"
import CartIcon from "../components/CartIcon"
import CartPopup from "../components/CartPopup"

export default function MainPage() {
  const [results,setResults] = useState([])
  const [cart,setCart] = useState([])
  const [showCart,setShowCart] = useState(false)
  function handleSearch(vals) {
    fetch(`/api/search?${new URLSearchParams(vals)}`)
      .then(r=>r.json())
      .then(data=>setResults(data.results||[]))
  }
  function handleAddToCart(itemWithLicense) {
    setCart(c =>
      [...c, {
        ...itemWithLicense,
        licenseModelName: itemWithLicense.licenseModels
          .find(l=>l.id===itemWithLicense.licenseModel)?.name,
        price: itemWithLicense.licenseModels
          .find(l=>l.id===itemWithLicense.licenseModel)?.price
      }]
    )
  }
  return (
    <div>
      <HeaderMenu right={<CartIcon count={cart.length} onClick={()=>setShowCart(true)} />} />
      <SearchBar onSearch={handleSearch} />
      <div style={{maxWidth:700,margin:"2em auto 0"}}>
        {results.map((item,i)=>
          <AudioResultCard key={i} item={item} onAddToCart={handleAddToCart} />
        )}
      </div>
      {showCart && (
        <CartPopup
          cart={cart}
          onClose={()=>setShowCart(false)}
          onCheckout={()=>alert("Bezahlprozess hier in Popup!")}
        />
      )}
    </div>
  )
}