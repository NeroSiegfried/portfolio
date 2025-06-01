"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

export default function About() {
  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          About Me
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <Image
                src="/placeholder.svg?height=400&width=400"
                alt="John Doe"
                width={400}
                height={400}
                className="rounded-lg object-cover shadow-lg"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="shadow-lg border-none">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-2xl font-bold mb-4">Hi, I'm John</h3>
                <p className="mb-4">
                  I'm a passionate Full Stack Developer with over 5 years of experience building modern web
                  applications. I specialize in creating responsive, accessible, and performant websites that deliver
                  exceptional user experiences.
                </p>
                <p className="mb-4">
                  My journey in web development began with a curiosity about how things work on the internet. That
                  curiosity evolved into a career where I've had the opportunity to work with startups and established
                  companies alike, helping them bring their digital visions to life.
                </p>
                <p>
                  When I'm not coding, you can find me exploring new technologies, contributing to open-source projects,
                  or enjoying outdoor activities to recharge my creative energy.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
