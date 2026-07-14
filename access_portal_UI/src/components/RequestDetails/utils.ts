import type { BpfStep } from "./types";

export const formatDate = (dateString: any): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).replace(',', '');
};

export const getStatusConfig = (status: number | string) => {
  const code = Number(status);
  if (code === 2 || status === 'Approved' || code === 5) {
    return { label: 'Approved', style: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400' };
  }
  if (code === 3 || status === 'Denied') {
    return { label: 'Denied', style: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400' };
  }
  return { label: 'Pending', style: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400' };
};

export const calculateRemainingTime = (approvedAt: string | null): { text: string; isUrgent: boolean } => {
  if (!approvedAt) return { text: '', isUrgent: false };
  
  const expiryDate = new Date(new Date(approvedAt).getTime() + 90 * 24 * 60 * 60 * 1000);
  const timeDifference = expiryDate.getTime() - new Date().getTime();

  if (timeDifference <= 0) return { text: 'Expired', isUrgent: true };

  const d = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const h = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((timeDifference % (1000 * 60)) / 1000);

  return { text: `${d}d ${h}h ${m}m ${s}s remaining`, isUrgent: d <= 7 };
};

export const determineWorkflowSteps = (reqStatus: number | string, itemStatus: number | string, approvedAt: string | null): BpfStep[] => {
  const rStatus = Number(reqStatus);
  const iStatus = Number(itemStatus);
  let [hodL, opL, accL] = ["HOD Approval", "Operator Action", "Access Granted"];
  let [hodS, opS, accS]: BpfStep['status'][] = ['upcoming', 'upcoming', 'upcoming'];

  if (rStatus === 3) {
    [hodS, hodL] = ['failed', 'HOD Rejected'];
  } else if (rStatus === 5 || iStatus >= 2) {
    hodS = 'completed';
    if (iStatus === 3) {
      [opS, opL] = ['failed', 'Operator Rejected'];
    } else if (approvedAt) {
      [opS, accS] = ['completed', 'completed'];
      if (new Date().getTime() > new Date(approvedAt).getTime() + 90 * 24 * 60 * 60 * 1000) accL = 'Access Expired';
    } else {
      opS = 'current';
    }
  } else {
    hodS = 'current';
  }

  return [
    { id: 1, label: "Submitted", status: 'completed' },
    { id: 2, label: hodL, status: hodS },
    { id: 3, label: opL, status: opS },
    { id: 4, label: accL, status: accS }
  ];
};
