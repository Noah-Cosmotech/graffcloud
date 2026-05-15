interface GCLogoProps {
  size?: number
  color?: string
}

export function GCLogo({ size = 28, color = 'currentColor' }: GCLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="GraffCloud">
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill={color} />
      <path
        d="M22 11.5C20.7 9.7 18.6 8.5 16.2 8.5C12 8.5 8.5 11.9 8.5 16C8.5 20.1 12 23.5 16.2 23.5C19.9 23.5 23 21 23.6 17.6H16.6V15H26V16.6C26 22 21.6 26.2 16.2 26.2C10.5 26.2 6 21.7 6 16C6 10.3 10.5 5.8 16.2 5.8C19.5 5.8 22.4 7.4 24.2 9.8L22 11.5Z"
        fill="#F5F1EA"
      />
    </svg>
  )
}
