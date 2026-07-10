// globals.d.ts
// Type declarations for side-effect imports (CSS, etc).
// next-env.d.ts alone doesn't cover all asset types in Next.js 14 +
// TypeScript 6 strict mode. This file makes the build happy.

declare module '*.css'
declare module '*.scss'
declare module '*.sass'
declare module '*.png' {
  const value: string
  export default value
}
declare module '*.jpg' {
  const value: string
  export default value
}
declare module '*.jpeg' {
  const value: string
  export default value
}
declare module '*.gif' {
  const value: string
  export default value
}
declare module '*.svg' {
  const value: string
  export default value
}
declare module '*.webp' {
  const value: string
  export default value
}
declare module '*.avif' {
  const value: string
  export default value
}
declare module '*.mp3' {
  const value: string
  export default value
}
declare module '*.mp4' {
  const value: string
  export default value
}