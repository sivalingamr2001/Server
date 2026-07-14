import React from 'react';
import { Check, X } from 'lucide-react';
import type { BusinessProcessFlowProps } from './types';
import { determineWorkflowSteps } from './utils';

export const BusinessProcessFlow: React.FC<BusinessProcessFlowProps> = ({
    requestStatus,
    itemStatus,
    approvedAtUtc
}) => {
    const steps = determineWorkflowSteps(requestStatus, itemStatus, approvedAtUtc);

    return (
        <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl mx-6">
            {steps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';
                const isFailed = step.status === 'failed';

                return (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center relative group">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-bold font-mono transition-all duration-300 ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20' :
                                    isCurrent ? 'bg-background border-blue-600 text-blue-600 animate-pulse scale-105 shadow-md shadow-blue-500/10' :
                                        isFailed ? 'bg-destructive border-destructive text-white' :
                                            'bg-background border-muted-foreground/30 text-muted-foreground'
                                }`}>
                                {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                {isFailed && <X className="w-3.5 h-3.5 stroke-[3]" />}
                                {!isCompleted && !isFailed && step.id}
                            </div>

                            <span className={`absolute -bottom-5 whitespace-nowrap text-[10px] font-bold tracking-tight transition-colors ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' :
                                    isCurrent ? 'text-blue-600 dark:text-blue-400 font-extrabold' :
                                        isFailed ? 'text-destructive' : 'text-muted-foreground'
                                }`}>
                                {step.label}
                            </span>
                        </div>

                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-[2px] mx-2 transition-colors duration-500 ${isCompleted && steps[idx + 1].status !== 'upcoming'
                                    ? 'bg-emerald-500'
                                    : 'bg-muted-foreground/20'
                                }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
