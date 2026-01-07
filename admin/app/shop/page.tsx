import { redirect } from 'next/navigation'

export default function ShopIndexRedirect() {
  redirect('/shop/products')
}
