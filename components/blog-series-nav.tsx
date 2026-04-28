"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { SeriesNode } from "@/lib/blog/types"

interface BlogSeriesNavProps {
  tree: SeriesNode[]
}

function buildSlugPath(nodeId: string, nodeMap: Map<string, SeriesNode>): string[] {
  const path: string[] = []
  let current = nodeMap.get(nodeId) ?? null
  while (current) {
    path.unshift(current.slug)
    current = current.parentId ? (nodeMap.get(current.parentId) ?? null) : null
  }
  return path
}

function flattenTree(nodes: SeriesNode[], map: Map<string, SeriesNode>) {
  nodes.forEach((n) => {
    map.set(n.id, n)
    flattenTree(n.children, map)
  })
}

function SeriesItem({
  node,
  nodeMap,
  depth,
}: {
  node: SeriesNode
  nodeMap: Map<string, SeriesNode>
  depth: number
}) {
  const [open, setOpen] = useState(depth === 0)
  const hasChildren = node.children.length > 0
  const href = `/blog/series/${buildSlugPath(node.id, nodeMap).join("/")}`

  return (
    <li>
      <Link
        href={href}
        className="group flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted/60 hover:text-primary"
      >
        <span className={`font-medium ${depth === 0 ? "text-foreground" : "text-muted-foreground group-hover:text-primary"}`}>
          {node.title}
        </span>
        {hasChildren && (
          <button
            type="button"
            aria-label={open ? "Collapse" : "Expand"}
            onClick={(e) => {
              e.preventDefault()
              setOpen((v) => !v)
            }}
            className="ml-2 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        )}
      </Link>

      {hasChildren && open && (
        <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-border/40 pl-2.5">
          {node.children.map((child) => (
            <SeriesItem key={child.id} node={child} nodeMap={nodeMap} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function BlogSeriesNav({ tree }: BlogSeriesNavProps) {
  const nodeMap = new Map<string, SeriesNode>()
  flattenTree(tree, nodeMap)

  if (!tree.length) {
    return <p className="text-sm text-muted-foreground">No series yet.</p>
  }

  return (
    <nav aria-label="Blog series navigation">
      <ul className="space-y-0.5">
        {tree.map((node) => (
          <SeriesItem key={node.id} node={node} nodeMap={nodeMap} depth={0} />
        ))}
      </ul>
    </nav>
  )
}
