'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0)
  if (!images.length) return <div className="aspect-[3/4] rounded-card bg-surface" />
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <div className="scrollbar-none flex gap-2 overflow-x-auto md:flex-col">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Фото ${i + 1}`}
            className={`relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition ${i === active ? 'ring-brand-500' : 'ring-transparent opacity-70 hover:opacity-100'}`}
          >
            <Image src={src} alt="" fill sizes="64px" className="object-cover" />
          </button>
        ))}
      </div>
      <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-card bg-surface">
        <AnimatePresence mode="wait">
          <motion.div key={images[active]} initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
            <Image src={images[active]} alt={title} fill loading="eager" sizes="(min-width:768px) 45vw, 100vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
