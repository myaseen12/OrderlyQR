'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChefHat } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[50vh] bg-background text-ink p-6 select-none">
      <div className="relative mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="h-16 w-16 rounded-full border-2 border-dashed border-primary"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <ChefHat className="h-6 w-6 text-primary" />
        </div>
      </div>
      <h3 className="font-mono text-sm font-bold tracking-wide animate-pulse">
        PRINTING ORDER TICKET...
      </h3>
      <p className="text-[10px] font-mono text-ink/40 mt-1 uppercase">
        Loading OrderlyQR Core
      </p>
    </div>
  )
}
