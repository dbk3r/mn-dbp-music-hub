type AvatarProps = {
  src?: string | null
  firstName?: string | null
  lastName?: string | null
  size?: number
}

export default function Avatar({ src, firstName, lastName, size = 64 }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt="Avatar"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #e5e7eb",
        }}
      />
    )
  }

  // Generate initials
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((name) => name![0].toUpperCase())
    .join("")
    .slice(0, 2)

  // Generate color from name
  const colorFromName = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = hash % 360
    return `hsl(${hue}, 65%, 55%)`
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ")
  const bgColor = fullName ? colorFromName(fullName) : "#9ca3af"

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bgColor,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 600,
        border: "2px solid #e5e7eb",
      }}
    >
      {initials || "?"}
    </div>
  )
}
