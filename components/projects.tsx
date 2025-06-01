"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github, ChevronDown, LayoutGrid } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

const projects = [
  {
    id: 1,
    title: "E-Commerce Platform",
    description: "A full-featured online store with cart, checkout, and payment processing",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Stripe"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 2,
    title: "Task Management App",
    description: "A collaborative task manager with real-time updates and team features",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["React", "Firebase", "Styled Components", "Redux"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 3,
    title: "Health & Fitness Tracker",
    description: "Mobile-first application for tracking workouts and nutrition goals",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["React Native", "GraphQL", "Node.js", "MongoDB"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 4,
    title: "AI Content Generator",
    description: "Tool that uses machine learning to generate blog posts and social media content",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["Python", "TensorFlow", "Flask", "React"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 5,
    title: "Real Estate Marketplace",
    description: "Platform connecting buyers, sellers, and agents with property listings and virtual tours",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["Vue.js", "Node.js", "Express", "MongoDB"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 6,
    title: "Social Media Dashboard",
    description: "Analytics dashboard for tracking engagement across multiple social platforms",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["React", "D3.js", "Material UI", "Firebase"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 7,
    title: "Video Streaming Service",
    description: "Platform for creators to upload, manage, and monetize video content",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["Next.js", "AWS S3", "FFmpeg", "Stripe"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 8,
    title: "Recipe Sharing Community",
    description: "Social platform for food enthusiasts to share and discover recipes",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["React", "GraphQL", "PostgreSQL", "Cloudinary"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 9,
    title: "Learning Management System",
    description: "Educational platform with courses, quizzes, and progress tracking",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["Angular", "Node.js", "MongoDB", "Socket.io"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 10,
    title: "Weather Forecast App",
    description: "Real-time weather data with interactive maps and alerts",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["React", "OpenWeatherAPI", "Mapbox", "PWA"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 11,
    title: "Cryptocurrency Dashboard",
    description: "Real-time tracking and analysis of cryptocurrency markets",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["Vue.js", "Chart.js", "CoinGecko API", "Vuetify"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    id: 12,
    title: "Travel Itinerary Planner",
    description: "Tool for planning and organizing travel itineraries with maps and recommendations",
    image: "/placeholder.svg?height=300&width=500",
    technologies: ["React", "Google Maps API", "Node.js", "MongoDB"],
    liveUrl: "#",
    githubUrl: "#",
  },
]

export default function Projects() {
  const [visibleProjects, setVisibleProjects] = useState(3)

  const showMoreProjects = () => {
    setVisibleProjects((prev) => Math.min(prev + 3, projects.length))
  }

  const showAllProjects = () => {
    setVisibleProjects(projects.length)
  }

  return (
    <section id="projects" className="py-20">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Featured Projects
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.slice(0, visibleProjects).map((project, index) => (
            <motion.div
              key={project.id}
              className="project-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="project-card-inner h-full">
                <Card className="project-card-front h-full flex flex-col">
                  <div className="relative h-48 w-full">
                    <Image
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                    <p className="text-muted-foreground mb-4 flex-grow">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {project.technologies.slice(0, 2).map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {project.technologies.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.technologies.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="project-card-back absolute inset-0 h-full flex flex-col justify-center items-center p-6">
                  <h3 className="text-xl font-bold mb-4">{project.title}</h3>
                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {project.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <Button asChild size="sm" className="gap-2">
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Live Demo
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                        Code
                      </a>
                    </Button>
                  </div>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>

        {visibleProjects < projects.length && (
          <motion.div
            className="flex justify-center mt-12 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={showMoreProjects}
              variant="outline"
              className="gap-2 border-primary text-primary hover:bg-primary/10"
            >
              Show More
              <ChevronDown className="h-4 w-4" />
            </Button>

            <Button
              onClick={showAllProjects}
              variant="outline"
              className="gap-2 border-secondary text-secondary hover:bg-secondary/10"
            >
              Show All
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
