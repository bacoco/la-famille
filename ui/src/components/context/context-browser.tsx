"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ContextBrowser() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Context Bus Browser</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Search and browse the shared context bus. Query entries by namespace,
          view claims, and explore agent trajectories.
        </p>
        <p className="text-sm text-muted-foreground mt-4">Coming in Phase 3</p>
      </CardContent>
    </Card>
  );
}
