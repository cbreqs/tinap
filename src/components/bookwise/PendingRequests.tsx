
"use client";

import * as React from "react";
import type { CustomerUpdateRequest } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type PendingRequestsProps = {
    requests: CustomerUpdateRequest[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
};

export function PendingRequests({ requests, onApprove, onReject }: PendingRequestsProps) {
    const pending = requests.filter(r => r.status === 'pending');

    if (pending.length === 0) {
        return null;
    }

    return (
        <div className="mt-6">
            <h2 className="px-2 text-sm font-semibold tracking-tight text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Pending Updates
            </h2>
            <div className="space-y-2 mt-2">
                {pending.map(req => (
                    <Card key={req.id} className="p-3 text-xs">
                        <p><strong>{req.currentData.name}</strong></p>
                        {req.requestedData.name && req.requestedData.name !== req.currentData.name && <p>Name: {req.currentData.name} → {req.requestedData.name}</p>}
                        {req.requestedData.email && req.requestedData.email !== req.currentData.email && <p>Email: {req.currentData.email} → {req.requestedData.email}</p>}
                         <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onApprove(req.id)}>Approve</Button>
                            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => onReject(req.id)}>Reject</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
