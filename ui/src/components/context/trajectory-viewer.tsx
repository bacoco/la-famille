"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TrajectoryViewer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Trajectories</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Trace agent actions, inputs, outputs, and context references.
          Understand decision paths and reasoning chains.
        </p>
        <p className="text-sm text-muted-foreground mt-4">Coming in Phase 3</p>
      </CardContent>
    </Card>
  );
}
