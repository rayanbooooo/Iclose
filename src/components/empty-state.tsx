"use client";

import { motion } from "motion/react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function EmptyState({
  icon,
  title,
  description,
  phase,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <Card className="overflow-hidden border-dashed">
      <CardHeader>
        <div className="relative mb-2 flex size-10 items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-lg bg-primary/15"
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative flex size-9 items-center justify-center rounded-md border border-primary/20 bg-muted text-primary">
            {icon}
          </div>
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          {phase}
        </div>
      </CardContent>
    </Card>
  );
}
