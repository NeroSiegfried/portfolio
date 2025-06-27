// components/projects.tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github, ChevronDown, LayoutGrid } from "lucide-react"
import Image from "next/image"

interface Project {
  id: number
  title: string
  description: string
  coverUrl: string          // GitHub OG preview URL
  technologies: string[]
  liveUrl?: string
  githubUrl: string         // actual GitHub repo URL
}

const projects: Project[] = [
  {
    id: 1,
    title: "Anagrams - Word Puzzle Game",
    description:
      "A cozy word-play challenge with casino-style elegance. Features single-player mode and real-time multiplayer matches. This was an experiment to test the limitations of AI tools in building complex web applications with modern technologies.",
    coverUrl: "https://opengraph.githubassets.com/1/NeroSiegfried/anagrams2", 
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Neon", "Vercel", "Cursor"],
    liveUrl: "https://v0-anagram-game-requirements-3kan9rqne-nerosiegfrieds-projects.vercel.app/",
    githubUrl: "https://github.com/NeroSiegfried/anagrams2", 
  },
  {
    id: 2,
    title: "Simple SQL Server",
    description:
      "A lightweight SQLite clone with persistence written in C—built from scratch following the cstack tutorial.",
    coverUrl: "https://opengraph.githubassets.com/1/NeroSiegfried/C-Database", 
    technologies: ["C", "Bash", "RSpec"],
    githubUrl: "https://github.com/NeroSiegfried/C-Database", 
  },
  {
    id: 3,
    title: "EasyChess DSML",
    description:
      "A domain-specific modelling language for chess notation, with syntax highlighting, code validation, and code generation—implemented in Java & Xtext.",
    coverUrl: "https://opengraph.githubassets.com/1/NeroSiegfried/EasyChess-DSL", 
    technologies: ["Java", "Xtext", "Xtend"],
    githubUrl: "https://github.com/NeroSiegfried/EasyChess-DSL", 
  },
  {
    id: 4,
    title: "Fitness Tracker",
    description:
      "A web-based fitness tracker that recommends workouts and meals for beginners via OpenAI API. Includes metrics, workout history, and progressive overload features.",
    coverUrl: "https://opengraph.githubassets.com/1/NeroSiegfried/fitness-tracker", 
    technologies: ["React", "Node.js", "OpenAI API"],
    liveUrl: "#", // update if deployed
    githubUrl: "https://github.com/NeroSiegfried/fitness-tracker", 
  },
  {
    id: 5,
    title: "Anagrams Game (Legacy)",
    description:
      "A single-player, web-based implementation of Game Pigeon's anagram game—for practice and paywall feature access simulation.",
    coverUrl: "https://opengraph.githubassets.com/1/NeroSiegfried/anagrams-game", 
    technologies: ["JavaScript", "HTML", "CSS"],
    liveUrl: "#",
    githubUrl: "https://github.com/NeroSiegfried/anagrams-game", 
  },
  {
    id: 6,
    title: "Blog Platform",
    description:
      "A simple multi-role blog with separate features for the owner, registered users, and guests—showcasing full-stack front-end and back-end skills using EJS templates and PostgreSQL.",
    coverUrl: "https://opengraph.githubassets.com/1/NeroSiegfried/blog-project", 
    technologies: ["EJS", "HTML", "CSS", "JavaScript", "PostgreSQL"],
    liveUrl: "#",
    githubUrl: "https://github.com/NeroSiegfried/blog-project", 
  },
  {
    id: 7,
    title: "Report Generator",
    description:
      "Web app that automates a departmental report by scraping an external database and formatting results; integrates AI API to suggest insights to newcomers.",
    coverUrl: "https://opengraph.githubassets.com/1/NeroSiegfried/report-generator", 
    technologies: ["Python", "Flask", "BeautifulSoup", "AI API"],
    githubUrl: "https://github.com/NeroSiegfried/report-generator", 
  },
  {
    id: 8,
    title: "Model Surveillance Satellite",
    description:
      "Collaborated on a team to design, model, and program a surveillance satellite prototype—handled networking, image processing, and general programming.",
    coverUrl: "/projects/model-satellite.jpg", 
    technologies: ["Python", "Linux", "Bash", "FFmpeg"],
    githubUrl: "#", // Not on GitHub
  },
]

export default function Projects() {
  const [visible, setVisible] = useState(3)

  const showMore = () => setVisible((prev) => Math.min(prev + 3, projects.length))
  const showAll = () => setVisible(projects.length)

  return (
    <section id="projects" className="py-20">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-center mb-16 text-4xl font-bold"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          My Projects
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.slice(0, visible).map((project, idx) => (
            <motion.div
              key={project.id}
              className="project-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="project-card-inner h-full">
                {/* Front side */}
                <Card className="project-card-front h-full flex flex-col">
                  <div className="relative h-48 w-full">
                    <Image
                      src={project.coverUrl}
                      alt={`${project.title} cover`}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold mb-2">
                      {project.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 flex-grow">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {project.technologies.slice(0, 2).map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="text-xs"
                        >
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

                {/* Back side */}
                <Card className="project-card-back absolute inset-0 h-full flex flex-col justify-center items-center p-6">
                  <h3 className="text-xl font-bold mb-4">{project.title}</h3>
                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {project.technologies.map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    {project.liveUrl && (
                      <Button asChild size="sm" className="gap-2">
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Live Demo
                        </a>
                      </Button>
                    )}
                    {project.githubUrl !== "#" && (
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="h-4 w-4" />
                          Code
                        </a>
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>

        {visible < projects.length && (
          <motion.div
            className="flex justify-center mt-12 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={showMore}
              variant="outline"
              className="gap-2 border-primary text-primary hover:bg-primary/10"
            >
              Show More
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              onClick={showAll}
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
