// components/about.tsx
"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

export default function About() {
  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-center mb-16 text-4xl font-bold"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          About Me
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Headshot */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <Image
                src="/victor-nabasu.jpg"
                alt="Victor Nabasu"
                width={400}
                height={400}
                className="rounded-lg object-cover shadow-lg"
              />
            </div>
          </motion.div>

          {/* Right: Concise Bio */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="shadow-lg border-none">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-2xl font-bold mb-4">Hi, I’m Victor</h3>
                <p className="mb-6 text-base leading-relaxed">
                  I’m a Full Stack Developer and software engineering student in London, passionate about transforming complex problems into elegant, production-ready code.
                </p>
                <p className="text-base leading-relaxed">
                  I’ve worked on projects ranging from satellite modeling to domain‐specific languages (DSML) and AI‐powered web apps. In my free time, I mentor aspiring developers and explore new AI and DevOps technologies.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
