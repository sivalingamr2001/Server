import accessManagementApi from "@/api/accessManagementApi";
import { CreateRequestModal } from "@/components/AccessRequest/create-request-modal";
import DynamicGrid from "@/components/DynamicGrid";
import type { GridActionButton } from "@/components/DynamicGrid/types";
import { Button } from "@/components/ui/button";
import { useLoader } from "@/hooks/useLoader";
import { ACCESS_TYPE_MAP, DEFAULT_STATUS, getAccessTypeLabel, STATUS_MAP } from "@/lib/utils";
import { Download, Eye, Plus } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // 1. Added visibility tracker state
  const { loading, withLoader } = useLoader();
  const navigate = useNavigate();

  const loadAllRequests = useCallback(async () => {
    try {
      const res = await withLoader(() => accessManagementApi.requests.getAll());
      setRequests(res || []);
    } catch (error) {
      setRequests([]);
      toast.error("Failed to load requests. Please try again later.");
    }
  }, [withLoader]);

  useEffect(() => {
    loadAllRequests();
  }, [loadAllRequests]);

  const handleRefresh = useCallback(() => {
    loadAllRequests();
  }, [loadAllRequests]);

  const handleViewClick = useCallback((rowData: any) => {
    navigate(`/request/${rowData.requestId}/item/${rowData.accessItemId}`);
  }, [navigate]);

  const columns = useMemo(() => [
    { field: "ticketNumber", headerName: "Ticket Number", width: 110 },
    { field: "folderPath", headerName: "Reqested Folder Path", width: 100, flex: 1 },
    {
      field: "requesterName",
      headerName: "Requester Name",
      width: 150,
    },
    {
      field: "accessType",
      headerName: "Access Type",
      width: 150,
      cellRenderer: (params: any) => {
        const config = ACCESS_TYPE_MAP[params.value] || {
          label: getAccessTypeLabel(params.value),
          className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
        };
        return (
          <div className="flex h-full items-center">
            <span className={`inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
              {config.label}
            </span>
          </div>
        );
      }
    },
    {
      field: "createdOn",
      headerName: "Created On",
      width: 150,
    },
    {
      field: "requestStatus",
      headerName: "Status",
      width: 130,
      cellRenderer: (params: any) => {
        const config = STATUS_MAP[params.value] || DEFAULT_STATUS;
        return (
          <div className="flex h-full items-center">
            <span className={`inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
              {config.label}
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Actions",
      sortable: false,
      filter: false,
      width: 100,
      pinned: "right" as const,
      cellRenderer: (params: any) => {
        if (!params.data) return null;
        return (
          <div className="flex h-full items-center justify-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => handleViewClick(params.data)}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [handleViewClick]);

  const actionButtons = useMemo<GridActionButton[]>(() => [
    {
      label: "Export Logs",
      onClick: () => toast.info("Exporting records..."),
      variant: "secondary",
      isDisabled: loading,
      icon: Download,
    },
    {
      label: "New Request",
      // 2. Wired up action to launch creation workflow workspace modal directly
      onClick: () => setIsModalOpen(true),
      variant: "primary",
      icon: Plus,
    },
  ], [loading]);

  return (
    <div className="flex h-[calc(100vh-(--spacing(20)))] w-full flex-col overflow-hidden bg-background text-foreground">
      <DynamicGrid
        title="Requests History"
        description="Track and monitor your enterprise access history logs"
        isLoading={loading}
        columnDefs={columns}
        rowData={requests}
        hasSearch={true}
        hasRefresh={true}
        onRefresh={handleRefresh}
        actionButtons={actionButtons}
      />

      <CreateRequestModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default MyRequestsPage;
