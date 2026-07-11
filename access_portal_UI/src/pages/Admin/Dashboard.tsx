import {
  CheckCircle2,
  Clock,
  FileText,
  FolderLock,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { useState } from 'react';

interface DashboardMetrics {
  TotalAccessItems: number;
  ActiveItems: number;
  InactiveItems: number;
  Status_Submitted: number;
  Status_HodApproved: number;
  Status_HodRejected: number;
  Status_OperatorApproved: number;
  Status_OperatorRejected: number;
  Status_AccessGranted: number;
  Status_AccessDenied: number;
  Status_AccessExpired: number;
  Status_AccessRevoked: number;
  Type_NotApplicable: number;
  Type_ReadOnly: number;
  Type_ReadAndWrite: number;
  TotalPendingAction: number;
}

export const AccessDashboard = () => {
  const [metrics] = useState<DashboardMetrics>({
    TotalAccessItems: 1,
    ActiveItems: 1,
    InactiveItems: 0,
    Status_Submitted: 1,
    Status_HodApproved: 0,
    Status_HodRejected: 0,
    Status_OperatorApproved: 0,
    Status_OperatorRejected: 0,
    Status_AccessGranted: 0,
    Status_AccessDenied: 0,
    Status_AccessExpired: 0,
    Status_AccessRevoked: 0,
    Type_NotApplicable: 0,
    Type_ReadOnly: 1,
    Type_ReadAndWrite: 0,
    TotalPendingAction: 1,
  });

  // Aggregate negative configurations for health checks
  const systemExceptions =
    metrics.Status_HodRejected +
    metrics.Status_OperatorRejected +
    metrics.Status_AccessDenied +
    metrics.Status_AccessExpired +
    metrics.Status_AccessRevoked;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Access Requests Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time lifecycle monitoring and compliance auditing.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm border border-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Sync Active
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Urgent Pending Action */}
        <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Action Required</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-slate-900">{metrics.TotalPendingAction}</h3>
            <p className="mt-1 text-xs text-amber-600 font-medium">
              Items awaiting standard lifecycle review
            </p>
          </div>
        </div>

        {/* Total Active Items */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Active Records</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <FolderLock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-slate-900">{metrics.ActiveItems}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {metrics.InactiveItems} archived system entries
            </p>
          </div>
        </div>

        {/* System Health / Granted Volume */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Access Granted Total</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-slate-900">{metrics.Status_AccessGranted}</h3>
            <p className="mt-1 text-xs text-slate-500">Active live permissions</p>
          </div>
        </div>
      </div>

      {/* Row 2: Visual Lifecycle Progress Train */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-base font-semibold text-slate-900 flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-400" /> Current Requests Pipeline Flow
        </h2>
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="absolute left-4 top-1/2 hidden h-0.5 w-[calc(100%-2rem)] -translate-y-1/2 bg-slate-200 md:block z-0" />

          {/* Step 1: Submitted */}
          <div className="relative z-10 flex items-center gap-4 bg-white pr-4 md:flex-col md:gap-2 md:text-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold shadow-sm transition-all ${metrics.Status_Submitted > 0 ? 'border-blue-600 bg-blue-50 text-blue-600 ring-4 ring-blue-50' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
              {metrics.Status_Submitted}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Submitted</p>
              <p className="text-xs text-slate-400">Initial Request</p>
            </div>
          </div>

          {/* Step 2: HOD Verification */}
          <div className="relative z-10 flex items-center gap-4 bg-white px-4 md:flex-col md:gap-2 md:text-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold shadow-sm transition-all ${metrics.Status_HodApproved > 0 ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
              {metrics.Status_HodApproved}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">HOD Approved</p>
              <p className="text-xs text-slate-400">Dept. Verification</p>
            </div>
          </div>

          {/* Step 3: Operator Processing */}
          <div className="relative z-10 flex items-center gap-4 bg-white px-4 md:flex-col md:gap-2 md:text-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold shadow-sm transition-all ${metrics.Status_OperatorApproved > 0 ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
              {metrics.Status_OperatorApproved}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Operator Approved</p>
              <p className="text-xs text-slate-400">IT Ops Provisioning</p>
            </div>
          </div>

          {/* Step 4: Final Success */}
          <div className="relative z-10 flex items-center gap-4 bg-white pl-4 md:flex-col md:gap-2 md:text-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold shadow-sm transition-all ${metrics.Status_AccessGranted > 0 ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
              {metrics.Status_AccessGranted}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Access Active</p>
              <p className="text-xs text-slate-400">Ready to Use</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Side: Type breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" /> Access Type Scope
          </h2>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs font-medium">
                <span className="text-slate-600">Read Only</span>
                <span className="text-slate-900 font-semibold">{metrics.Type_ReadOnly} Item(s)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: metrics.TotalAccessItems > 0 ? `${(metrics.Type_ReadOnly / metrics.TotalAccessItems) * 100}%` : '0%' }}></div>
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs font-medium">
                <span className="text-slate-600">Read & Write</span>
                <span className="text-slate-900 font-semibold">{metrics.Type_ReadAndWrite} Item(s)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-purple-500 transition-all" style={{ width: metrics.TotalAccessItems > 0 ? `${(metrics.Type_ReadAndWrite / metrics.TotalAccessItems) * 100}%` : '0%' }}></div>
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs font-medium">
                <span className="text-slate-600">Not Applicable</span>
                <span className="text-slate-900 font-semibold">{metrics.Type_NotApplicable} Item(s)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-amber-500 transition-all" style={{ width: metrics.TotalAccessItems > 0 ? `${(metrics.Type_NotApplicable / metrics.TotalAccessItems) * 100}%` : '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Table Actions Log */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-slate-400" /> Action Required Queue
            </h2>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm text-slate-500">
              <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Task Scope</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                    Pending Access Approvals
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 border border-slate-100">
                      Standard
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 border border-amber-100">
                      Submitted
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                      Review Item
                    </button>
                  </td>
                </tr>

                {systemExceptions > 0 && (
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                      System Exception Audit Log
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 border border-slate-100">
                        N/A
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-800 border border-red-100">
                        Review Required
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
                        View Logs
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
