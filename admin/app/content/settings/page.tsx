import { redirect } from 'next/navigation'

export default function ContentSettingsRedirect() {
  redirect('/settings/profile')
}
