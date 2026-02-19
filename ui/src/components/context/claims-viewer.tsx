"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClaimsViewer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Claims Ledger</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          View validated knowledge claims across the family.
          Track confidence scores and validation history.
        </p>
        <p className="text-sm text-muted-foreground mt-4">Coming in Phase 3</p>
      </CardContent>
    </Card>
  );
}
