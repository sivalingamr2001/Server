import accessManagementApi from '@/api/accessManagementApi';
import { EditRequestModal } from '@/components/AccessRequest/EditRequestModal';
import { ArrowLeft } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ActionControlTray } from '../../components/RequestDetails/ActionControlTray';
import { BusinessProcessFlow } from '../../components/RequestDetails/BusinessProcessFlow';
import { InfoRow } from '../../components/RequestDetails/SubComponents';
import { calculateRemainingTime, formatDate, getStatusConfig } from '../../components/RequestDetails/utils';

export const RequestDetails: React.FC = () => {
    const { requestId, itemId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [countdown, setCountdown] = useState({ text: '', isUrgent: false });
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editPayload, setEditPayload] = useState<any>(null);

    const getReqdata = useCallback(async () => {
        if (!requestId || !itemId) return;
        const res = await accessManagementApi.requests.getById(Number(requestId), Number(itemId));
        setData(res);
    }, [requestId, itemId]);

    useEffect(() => { getReqdata(); }, [getReqdata]);

    useEffect(() => {
        if (!data?.approvedAtUtc) return;
        const interval = setInterval(() => {
            setCountdown(calculateRemainingTime(data.approvedAtUtc));
        }, 1000);
        return () => clearInterval(interval);
    }, [data?.approvedAtUtc]);

    const statusInfo = useMemo(() => getStatusConfig(data?.requestStatus), [data?.requestStatus]);
    const handleBackClick = useCallback(() => navigate(-1), [navigate]);
    const handleWorkflowAction = useCallback((type: string) => {
        if (type === 'edit' && data) {
            setEditPayload({
                requestId: Number(requestId),
                request: {
                    userId: data.userId,
                    reqTo: data.reqTo,
                    isAgreed: Boolean(data.isAgreed),
                    itsrNo: data.itsrNo,
                    currentStatus: data.requestStatus,
                    currentApproverId: data.currentApproverId,
                },
                items: [{
                    id: data.accessItemId,
                    accessType: data.accessType,
                    confirmAccessType: data.confirmAccessType,
                    folderPath: data.folderPath || "",
                    reason: data.reason || "",
                    ticketNumber: data.ticketNumber || "",
                    status: data.itemStatus || 1,
                }],
            })
            setIsEditOpen(true)
            return
        }

        console.log(`Workflow Action: ${type}`)
    }, [data, requestId]);

    if (!data) return <div className="flex h-64 w-full items-center justify-center text-sm text-zinc-500">Loading...</div>;

    return (
        <>
            <div className="w-full max-w-7xl mx-auto p-6 bg-transparent text-foreground">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8 pb-5 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3 min-w-[240px]">
                        <button type="button" onClick={handleBackClick} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                            <ArrowLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Request Details</h1>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.style}`}>{statusInfo.label}</span>
                            </div>
                            <p className="text-xs text-zinc-400 font-mono mt-0.5">Ticket: {data.ticketNumber}</p>
                        </div>
                    </div>

                    <BusinessProcessFlow requestStatus={data.requestStatus} itemStatus={data.itemStatus} approvedAtUtc={data.approvedAtUtc} />

                    <div className="flex items-center gap-4 justify-end min-w-[260px]">
                        {countdown.text && (
                            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${countdown.isUrgent ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}>
                                {countdown.text}
                            </span>
                        )}
                        <ActionControlTray status={data.requestStatus} onAction={handleWorkflowAction} />
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-900">
                        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Request Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <InfoRow label="Requester Name" value={data.requesterName} />
                            <InfoRow label="Requester Email" value={data.requesterEmail} />
                            <InfoRow label="Request Target" value={data.reqTo} />
                            <InfoRow label="ITSR Number" value={data.itsrNo} isMono />
                            <InfoRow label="Created On" value={formatDate(data.createdOn)} />
                            <InfoRow label="Agreement Status" value={data.isAgreed ? 'Agreed' : 'Not Agreed'} />
                        </div>
                    </div>

                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10">
                        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Access Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <InfoRow label="Folder Path" value={data.folderPath} fullWidth isCode />
                            <InfoRow label="Access Type" value={data.accessType} />
                            <InfoRow label="Confirmed Access Type" value={data.confirmAccessType} />
                            <InfoRow label="Valid From" value={formatDate(data.approvedAtUtc)} />
                            <InfoRow label="Expires On" value={formatDate(data.expiresAtUtc)} />
                            <InfoRow label="Reason / Justification" value={data.reason} fullWidth />
                            {data.rejectionReason && <InfoRow label="Rejection Reason" value={data.rejectionReason} fullWidth />}
                        </div>
                    </div>
                </div>
            </div>

            <EditRequestModal
                isOpen={isEditOpen}
                onOpenChange={setIsEditOpen}
                payload={editPayload}
                onSuccess={getReqdata}
            />
        </>
    );
};

export default RequestDetails;
