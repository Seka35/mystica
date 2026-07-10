'use client'
// components/ParticleField.tsx
// 30 golden floating particles — pure CSS/JS, no canvas library needed

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  opacityDir: number
  el: HTMLDivElement
}

export default function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const count = window.innerWidth < 640 ? 20 : 30
    const particles: Particle[] = []

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div')
      el.className = 'particle'
      const size = Math.random() * 3 + 1
      const opacity = Math.random() * 0.5 + 0.1
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, #F0C040, #C8963C);
        opacity: ${opacity};
        left: ${Math.random() * 100}vw;
        top: ${Math.random() * 100}vh;
      `
      container.appendChild(el)

      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.1, // slight upward drift
        size,
        opacity,
        opacityDir: Math.random() > 0.5 ? 1 : -1,
        el,
      })
    }

    particlesRef.current = particles

    function animate() {
      const w = window.innerWidth
      const h = window.innerHeight

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        // Wrap around edges
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        // Pulse opacity
        p.opacity += p.opacityDir * 0.003
        if (p.opacity > 0.65 || p.opacity < 0.05) p.opacityDir *= -1

        p.el.style.transform = `translate(${p.x}px, ${p.y}px)`
        p.el.style.opacity = String(p.opacity)
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    // Reset positions to use transform instead of left/top
    for (const p of particles) {
      p.el.style.left = '0'
      p.el.style.top = '0'
      p.el.style.transform = `translate(${p.x}px, ${p.y}px)`
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      particles.forEach(p => p.el.remove())
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}
