import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { playSuccessSound } from '@/lib/sounds'

interface SuccessAnimationProps {
  show: boolean
}

export function SuccessAnimation({ show }: SuccessAnimationProps) {
  useEffect(() => {
    if (show) {
      playSuccessSound()
    }
  }, [show])

  if (!show) return null

  // Generate random particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30) + Math.random() * 15,
    distance: 60 + Math.random() * 40,
    size: 4 + Math.random() * 4,
    color: ['#9945FF', '#14F195', '#00D1FF', '#FFD700'][i % 4],
    delay: Math.random() * 0.1,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Center burst effect */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 blur-xl" />
      </motion.div>

      {/* Particles */}
      {particles.map((particle) => {
        const radians = (particle.angle * Math.PI) / 180
        const x = Math.cos(radians) * particle.distance
        const y = Math.sin(radians) * particle.distance

        return (
          <motion.div
            key={particle.id}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              marginLeft: -particle.size / 2,
              marginTop: -particle.size / 2,
            }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: x,
              y: y,
              scale: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.6,
              delay: particle.delay,
              ease: 'easeOut',
            }}
          />
        )
      })}

      {/* Ring effect */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-green-400"
        initial={{ width: 0, height: 0, opacity: 1 }}
        animate={{ width: 150, height: 150, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}
