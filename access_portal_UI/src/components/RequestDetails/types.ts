import React from 'react';

export interface InfoRowProps {
  label: string;
  value: string | number | null;
  fullWidth?: boolean;
  isMono?: boolean;
  isCode?: boolean;
}

export interface ApprovalCardProps {
  title: string;
  name?: string | null;
  email?: string | null;
  isCurrent?: boolean;
}

export interface ActionControlTrayProps {
  status: number | string;
  onAction: (actionType: string) => void;
}

export interface BpfStep {
  id: number;
  label: string;
  status: 'upcoming' | 'current' | 'completed' | 'failed';
}

export interface BusinessProcessFlowProps {
  requestStatus: number | string;
  itemStatus: number | string;
  approvedAtUtc: string | null;
}
