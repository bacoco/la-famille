export interface FamilyMember {
  agentId: string;
  role: string;
  order: number;
}

export interface Family {
  id: string;
  name: string;
  emoji: string;
  description: string;
  members: FamilyMember[];
  createdAt: string;
}
