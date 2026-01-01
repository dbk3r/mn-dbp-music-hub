export default function CartIcon({count, onClick}) {
  return (
    <span onClick={onClick} style={{position:"relative", cursor:"pointer",marginLeft:18,fontSize:"1.5em"}}>
      🛒
      {count > 0 && (<span style={{
        position:"absolute",top:-4,right:-8,background:"red",color:"#fff",
        borderRadius:"50%",fontSize:12,padding:"2px 7px"
      }}>{count}</span>)}
    </span>
  )
}