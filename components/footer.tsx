// components/footer.tsx
"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1])

  return (
    <motion.footer
      ref={footerRef}
      className="relative py-12 overflow-hidden bg-primary text-primary-foreground"
      style={{ opacity }}
    >
      {/* Geometric SVG tiling background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="trianglePattern"
              patternUnits="userSpaceOnUse"
              width="40"
              height="40"
            >
              <polygon points="20,0 40,20 0,20" fill="rgba(255,255,255,0.1)" />
              <polygon points="20,40 0,20 40,20" fill="rgba(255,255,255,0.1)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#trianglePattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h3 className="text-2xl font-bold">Victor Nabasu</h3>
            <p className="text-primary-foreground/80">
              Full Stack Developer & Engineer
            </p>
          </div>

          <div className="flex gap-6">
            <a
              href="https://github.com/NeroSiegfried"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* GitHub icon SVG omitted for brevity */}
            </a>
            <a
              href="https://www.linkedin.com/in/victor-nabasu-8b5223212/"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
            >
              {/* LinkedIn icon SVG omitted for brevity */}
            </a>
            <a
              href="https://twitter.com/NeroSiegfried"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              aria-label="Twitter"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-twitter"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center">
          <p className="text-primary-foreground/80">
            &copy; {new Date().getFullYear()} Victor Nabasu. All rights
            reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  )
}
