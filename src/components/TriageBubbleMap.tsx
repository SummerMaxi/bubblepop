"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as d3 from "d3-force";
import type { TriagedItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import { SOURCE_ICON } from "@/lib/format";
import {
  MIN_BUBBLE_RADIUS,
  MAX_BUBBLE_RADIUS,
  BUBBLE_RADIUS_CURVE,
  HIGH_IMPORTANCE_THRESHOLD,
  MEDIUM_IMPORTANCE_THRESHOLD,
} from "@/lib/constants";

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  item: TriagedItem;
  radius: number;
}

interface Edge {
  source: string;
  target: string;
}

interface Props {
  items: TriagedItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * Map an importance score (0-1) to a pixel radius using a power curve.
 * Higher curve values exaggerate the spread between low and high scores.
 */
export function importanceToRadius(importance: number) {
  const clamped = Math.max(0, Math.min(1, importance));
  const t = Math.pow(clamped, 1 / BUBBLE_RADIUS_CURVE);
  return MIN_BUBBLE_RADIUS + (MAX_BUBBLE_RADIUS - MIN_BUBBLE_RADIUS) * t;
}

/** Items sharing a `from` field are linked — drives clustering visualization. */
function buildEdges(items: TriagedItem[]): Edge[] {
  const buckets = new Map<string, string[]>();
  for (const item of items) {
    if (!item.from) continue;
    const key = item.from.toLowerCase();
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(item.id);
  }
  const edges: Edge[] = [];
  for (const ids of buckets.values()) {
    for (let i = 0; i < ids.length - 1; i++) {
      edges.push({ source: ids[i], target: ids[i + 1] });
    }
  }
  return edges;
}


export default function TriageBubbleMap({
  items,
  selectedId,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const simRef = useRef<d3.Simulation<SimNode, undefined> | null>(null);

  const edges = useMemo(() => buildEdges(items), [items]);

  // Track container size so the simulation can use real bounds.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    observer.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  // Build / rebuild the simulation when items or container size change.
  useEffect(() => {
    if (!size.width || !size.height || items.length === 0) return;
    const { width, height } = size;

    const initial: SimNode[] = items.map((item, i) => {
      const angle = (i / items.length) * Math.PI * 2;
      const r = Math.min(width, height) * 0.25;
      return {
        id: item.id,
        item,
        radius: importanceToRadius(item.importance),
        x: width / 2 + Math.cos(angle) * r,
        y: height / 2 + Math.sin(angle) * r,
      };
    });

    const sim = d3
      .forceSimulation<SimNode>(initial)
      // Most important = stronger pull to canvas center.
      .force(
        "x",
        d3
          .forceX<SimNode>(width / 2)
          .strength((d) => 0.04 + d.item.importance * 0.12),
      )
      .force(
        "y",
        d3
          .forceY<SimNode>(height / 2)
          .strength((d) => 0.04 + d.item.importance * 0.12),
      )
      // Gentle global repulsion so bubbles don't overlap.
      .force("charge", d3.forceManyBody<SimNode>().strength(-60))
      // Hard collision boundary with padding.
      .force(
        "collide",
        d3
          .forceCollide<SimNode>()
          .radius((d) => d.radius + 6)
          .iterations(2),
      )
      .alpha(1)
      .alphaDecay(0.04);

    // Custom force: pull together items sharing `from` (cluster effect).
    const groupingForce = (alpha: number) => {
      const byId = new Map(sim.nodes().map((n) => [n.id, n]));
      for (const edge of edges) {
        const a = byId.get(edge.source);
        const b = byId.get(edge.target);
        if (!a || !b) continue;
        const dx = (a.x ?? 0) - (b.x ?? 0);
        const dy = (a.y ?? 0) - (b.y ?? 0);
        const k = alpha * 0.05;
        a.vx = (a.vx ?? 0) - dx * k;
        a.vy = (a.vy ?? 0) - dy * k;
        b.vx = (b.vx ?? 0) + dx * k;
        b.vy = (b.vy ?? 0) + dy * k;
      }
    };
    sim.force("group", groupingForce);

    sim.on("tick", () => {
      const arr = sim.nodes();
      for (const n of arr) {
        const r = n.radius + 8;
        n.x = Math.max(r, Math.min(width - r, n.x ?? width / 2));
        n.y = Math.max(r, Math.min(height - r, n.y ?? height / 2));
      }
      setNodes([...arr]);
    });

    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, [items, edges, size]);

  // Lookup map for edge rendering.
  const nodeById = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-foreground"
      onClick={() => onSelect(null)}
    >
      {/* Dot pattern texture (design system) */}
      <div className="dot-pattern absolute inset-0 opacity-100" aria-hidden />

      {/* Radial accent glow at center, behind everything */}
      <div
        className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(0,82,255,0.18) 0%, transparent 65%)",
          filter: "blur(40px)",
        }}
        aria-hidden
      />

      {/* Connection lines layer */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      >
        {edges.map((edge, i) => {
          const a = nodeById.get(edge.source);
          const b = nodeById.get(edge.target);
          if (!a || !b) return null;
          const isHot =
            selectedId === edge.source || selectedId === edge.target;
          return (
            <line
              key={i}
              x1={a.x ?? 0}
              y1={a.y ?? 0}
              x2={b.x ?? 0}
              y2={b.y ?? 0}
              stroke={isHot ? "rgba(77,124,255,0.7)" : "rgba(255,255,255,0.12)"}
              strokeWidth={isHot ? 1.5 : 1}
              strokeDasharray={isHot ? undefined : "4 4"}
            />
          );
        })}
      </svg>

      {/* Bubbles */}
      {nodes.map((node) => {
        const Icon = SOURCE_ICON[node.item.source];
        const importance = node.item.importance;
        const isSelected = selectedId === node.id;
        const isHigh = importance > HIGH_IMPORTANCE_THRESHOLD;
        const isMed =
          importance > MEDIUM_IMPORTANCE_THRESHOLD &&
          importance <= HIGH_IMPORTANCE_THRESHOLD;

        return (
          <button
            key={node.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(isSelected ? null : node.id);
            }}
            aria-label={`${node.item.title} — importance ${(importance * 100).toFixed(0)}%`}
            aria-pressed={isSelected}
            className={cn(
              "absolute flex flex-col items-center justify-center rounded-full",
              "transition-all duration-300 ease-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-foreground",
              "hover:scale-105",
              isSelected && "scale-110 z-30",
            )}
            style={{
              width: node.radius * 2,
              height: node.radius * 2,
              left: (node.x ?? 0) - node.radius,
              top: (node.y ?? 0) - node.radius,
              background: isHigh
                ? "radial-gradient(circle at 30% 30%, #4d7cff, #0052ff 70%)"
                : isMed
                  ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 70%)"
                  : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 70%)",
              boxShadow: isHigh
                ? "0 8px 32px rgba(0,82,255,0.45), inset 0 2px 16px rgba(255,255,255,0.25)"
                : isMed
                  ? "0 4px 20px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.15)"
                  : "0 2px 12px rgba(0,0,0,0.25), inset 0 1px 6px rgba(255,255,255,0.1)",
              border: isHigh
                ? "1px solid rgba(255,255,255,0.35)"
                : "1px solid rgba(255,255,255,0.12)",
              backdropFilter: isHigh ? undefined : "blur(8px)",
            }}
          >
            {/* Pulsing ring for the most important item */}
            {isHigh && (
              <span
                className="absolute inset-0 rounded-full border border-white/30 pulse-dot"
                style={{ animationDuration: "3s" }}
                aria-hidden
              />
            )}

            <div className="flex flex-col items-center gap-1 px-2 text-center text-white">
              <Icon
                size={node.radius > 70 ? 22 : node.radius > 50 ? 18 : 14}
                strokeWidth={2}
                className={cn(
                  "drop-shadow",
                  isHigh ? "text-white" : "text-white/70",
                )}
              />
              {node.radius > 50 && (
                <span
                  className={cn(
                    "font-semibold leading-tight",
                    node.radius > 80 ? "text-sm" : "text-xs",
                    isHigh ? "text-white" : "text-white/85",
                  )}
                  style={{
                    maxWidth: node.radius * 1.6,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {node.item.title}
                </span>
              )}
            </div>
          </button>
        );
      })}

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50">
          <span className="font-mono text-xs uppercase tracking-[0.2em]">
            No items to triage
          </span>
        </div>
      )}
    </div>
  );
}
