// Shared portfolio content for the v2 site (components/v2/*).
// Project list mirrors the frozen v1 data (components/projects.tsx) but lives
// here so v2 components can consume it without touching the v1 library.

export type ShowcaseMode = "web" | "picture"

export interface Project {
  id: number
  title: string
  description: string
  technologies: string[]
  showcaseMode: ShowcaseMode
  desktopPreviewUrl?: string
  mobilePreviewUrl?: string
  ipadUrl?: string
  studioDisplayUrl?: string
  pictureSlides?: string[]
  liveUrl?: string
  githubUrl?: string
  blogPostSlug?: string
  waitFor?: number
}

export const projects: Project[] = [
  {
    id: 11,
    title: "Derivian",
    description:
      "A professional website for a supported living business in London. Built with accessibility at its core — including an easy-read mode for visually impaired users — and equipped with business email infrastructure and templated contact flows to streamline every client interaction.",
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    showcaseMode: "web",
    liveUrl: "https://www.derivian.co.uk",
    githubUrl: "https://github.com/NeroSiegfried/derivian-care",
    blogPostSlug: "derivian-build-log",
    waitFor: 3,
  },
  {
    id: 10,
    title: "Stitch Bloom",
    description: "A custom web application and showcase for the Stitch Bloom brand.",
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    showcaseMode: "web",
    liveUrl: "https://thestitchbloom.com/",
    githubUrl: "https://github.com/NeroSiegfried/stitch-bloom",
    blogPostSlug: "stitch-bloom",
  },
  {
    id: 9,
    title: "LoopBridge (ongoing)",
    description:
      "A website development project for a crypto trading community. Built in plain HTML, CSS, and JavaScript to keep contribution simple for frontend developers across different stacks.",
    technologies: ["HTML", "CSS", "JavaScript"],
    showcaseMode: "web",
    liveUrl: "https://www.loopbridge.network",
    githubUrl: "https://github.com/NeroSiegfried/LoopBridge",
    blogPostSlug: "loopbridge-build-log",
    waitFor: 1,
  },
  {
    id: 1,
    title: "Anagrams - Word Puzzle Game",
    description:
      "A cozy word-play challenge with casino-style elegance featuring both single-player and real-time multiplayer modes. This project tested AI-assisted workflows for complex web app development.",
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Neon", "Vercel", "Cursor"],
    showcaseMode: "web",
    liveUrl: "https://v0-anagram-game-requirements.vercel.app/",
    githubUrl: "https://github.com/NeroSiegfried/anagrams2",
    blogPostSlug: "anagrams-architecture-notes",
    waitFor: 6,
  },
  {
    id: 2,
    title: "Simple SQL Server",
    description:
      "A lightweight SQLite-style database in C with persistence, page management, and command parsing, implemented from scratch while following and extending the cstack tutorial path.",
    technologies: ["C", "Bash", "RSpec"],
    showcaseMode: "picture",
    pictureSlides: [],
    githubUrl: "https://github.com/NeroSiegfried/C-Database",
    blogPostSlug: "c-database-from-scratch",
  },
  {
    id: 3,
    title: "EasyChess DSML",
    description:
      "A domain-specific modeling language for chess notation with syntax highlighting, validation, and generation tooling built with Java, Xtext, and Xtend.",
    technologies: ["Java", "Xtext", "Xtend"],
    showcaseMode: "picture",
    pictureSlides: [],
    githubUrl: "https://github.com/NeroSiegfried/EasyChess-DSL",
    blogPostSlug: "easychess-dsl",
  },
  {
    id: 4,
    title: "Fitness Tracker",
    description:
      "A fitness app that suggests workouts and meals for beginners via AI APIs, including workout history and progression tracking for consistent improvement.",
    technologies: ["React", "Node.js", "OpenAI API"],
    showcaseMode: "web",
    githubUrl: "https://github.com/NeroSiegfried/fitness-tracker",
    blogPostSlug: "fitness-tracker-ai",
  },
  {
    id: 5,
    title: "Anagrams Game (Legacy)",
    description:
      "A browser-based single-player clone inspired by Game Pigeon anagrams, focused on core gameplay mechanics and UX flow experimentation.",
    technologies: ["JavaScript", "HTML", "CSS"],
    showcaseMode: "web",
    githubUrl: "https://github.com/NeroSiegfried/anagrams-game",
    blogPostSlug: "anagrams-legacy",
  },
  {
    id: 6,
    title: "Blog Platform",
    description:
      "A multi-role blog with owner, user, and guest experiences; implemented with EJS templates and PostgreSQL to showcase full-stack web delivery.",
    technologies: ["EJS", "HTML", "CSS", "JavaScript", "PostgreSQL"],
    showcaseMode: "web",
    githubUrl: "https://github.com/NeroSiegfried/blog-project",
    blogPostSlug: "blog-platform-ejs",
  },
  {
    id: 7,
    title: "Report Generator",
    description:
      "A departmental report automation app that scrapes external data and composes structured output, with AI-assisted insight suggestions for newcomers.",
    technologies: ["Python", "Flask", "BeautifulSoup", "AI API"],
    showcaseMode: "picture",
    pictureSlides: [],
    githubUrl: "https://github.com/NeroSiegfried/report-generator",
    blogPostSlug: "report-generator-ai",
  },
  {
    id: 8,
    title: "Model Surveillance Satellite",
    description:
      "A team-built surveillance satellite prototype involving networking, image processing, and systems-level programming.",
    technologies: ["Python", "Linux", "Bash", "FFmpeg"],
    showcaseMode: "picture",
    pictureSlides: ["/projects/model-satellite.jpg"],
    blogPostSlug: "model-surveillance-satellite",
  },
]

export interface TechItem {
  name: string
  logo: string
}

export const technologies: TechItem[] = [
  { name: "Python", logo: "/logos/python.svg" },
  { name: "C", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg" },
  { name: "C++", logo: "/logos/cpp.svg" },
  { name: "SQL", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-plain-wordmark.svg" },
  { name: "JavaScript", logo: "/logos/javascript.svg" },
  { name: "Java", logo: "/logos/java.svg" },
  { name: "TypeScript", logo: "/logos/typescript.svg" },
  { name: "Bash", logo: "/logos/bash.svg" },
  { name: "Xtext / Xtend", logo: "/logos/xtend.svg" },
  { name: "PostgreSQL", logo: "/logos/postgres.svg" },
  { name: "React", logo: "/logos/react.svg" },
  { name: "Node.js", logo: "/logos/nodejs.svg" },
  { name: "NumPy", logo: "/logos/numpy.svg" },
  { name: "Pandas", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pandas/pandas-original.svg" },
  { name: "Scikit-Learn", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/scikitlearn/scikitlearn-original.svg" },
  { name: "Docker", logo: "/logos/docker.svg" },
  { name: "AWS", logo: "/logos/aws.svg" },
  { name: "Tailwind CSS", logo: "/logos/tailwind.svg" },
  { name: "MongoDB", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-plain-wordmark.svg" },
  { name: "GraphQL", logo: "/logos/graphql.svg" },
]

export interface Stat {
  value: string
  label: string
}

export const stats: Stat[] = [
  { value: "11+", label: "Projects shipped" },
  { value: "8+", label: "Languages" },
  { value: "MSc", label: "Adv. Software Eng · KCL" },
  { value: "∞", label: "CS-from-scratch quest" },
]

export interface Service {
  title: string
  description: string
}

export const services: Service[] = [
  {
    title: "Full-stack web",
    description: "End-to-end product builds with React, Next.js and TypeScript — from data model to polished, responsive UI.",
  },
  {
    title: "APIs & backends",
    description: "Typed APIs, auth, and PostgreSQL data layers; serverless on Vercel or containers where it fits.",
  },
  {
    title: "Systems & fundamentals",
    description: "Low-level work in C and Python — databases from scratch, DSLs, networking and image processing.",
  },
  {
    title: "AI-assisted delivery",
    description: "Pragmatic use of AI APIs and tooling to ship faster without losing control of the architecture.",
  },
]

export interface Faq {
  q: string
  a: string
}

export const faqs: Faq[] = [
  {
    q: "Are you available for work?",
    a: "Yes — I'm currently open to full-stack / software engineering roles and interesting freelance projects. The fastest way to reach me is the form below or email.",
  },
  {
    q: "What's your core stack?",
    a: "TypeScript, React and Next.js on the front; Node and PostgreSQL on the back; Python and C for systems and data work. I deploy on Vercel and AWS.",
  },
  {
    q: "How do you work?",
    a: "Ship small, iterate in the open, and keep the architecture legible. I write build logs on the blog so the reasoning behind each project is documented.",
  },
  {
    q: "Where are you based?",
    a: "London, UK — available in person and remotely, across UK and international time zones.",
  },
]
