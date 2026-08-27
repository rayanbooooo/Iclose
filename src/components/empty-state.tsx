import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function EmptyState({
  icon: Icon,
  title,
  description,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4.5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{phase}</p>
      </CardContent>
    </Card>
  );
}
