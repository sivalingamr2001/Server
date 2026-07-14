import React from 'react';
import { Button } from '@/components/ui/button';
import type { ActionControlTrayProps } from './types';
import { useAuth } from '@/context/AuthContext';

export const ActionControlTray: React.FC<ActionControlTrayProps> = ({ status, onAction }) => {
  const { currentUserRole } = useAuth()
  const isApproved = status === 2 || status === 'Approved' || status === 5;
  const isPending = status === 1 || status === 'Pending';

  return (
    <div className="flex items-center gap-2">
      {currentUserRole === 'user' && isApproved && (
        <>
          <Button size="xs" variant="outline" onClick={() => onAction('edit')}>Resubmit</Button>
        </>
      )}
      {(currentUserRole === 'operator' || currentUserRole === 'hod') && isPending && (
        <>
          <Button size="xs" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4" onClick={() => onAction('approve')}>Approve</Button>
          <Button size="xs" variant="destructive" className="px-4" onClick={() => onAction('reject')}>Reject</Button>
        </>
      )}
      {currentUserRole === 'operator' && isApproved && (
        <Button size="xs" variant="destructive" onClick={() => onAction('revoke')}>Revoke</Button>
      )}
      {isApproved && (
        <>
          <Button size="xs" variant="outline" onClick={() => onAction('renew')}>Renew</Button>
        </>
      )}
    </div>
  );
};
