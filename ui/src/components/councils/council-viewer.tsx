"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CouncilViewer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Council Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          View COUNCIL deliberation sessions. Watch rounds unfold in real-time
          via SSE, track agent positions and convergence.
        </p>
        <p className="text-sm text-muted-foreground mt-4">Coming in Phase 4</p>
      </CardContent>
    </Card>
  );
}
