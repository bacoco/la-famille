"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CouncilRoundProps {
  roundNumber: number;
  phase: string;
}

export function CouncilRound({ roundNumber, phase }: CouncilRoundProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Round {roundNumber} — {phase}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Round details will show agent positions, confidence scores,
          and convergence metrics.
        </p>
      </CardContent>
    </Card>
  );
}
