import { useState, useEffect, useRef } from "react";
import { RefreshCw, Terminal, Calendar, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logApi } from "@/api/logApi";

interface LogLineItem {
    id: string;
    type: "line" | "fallback";
    level: "INF" | "WRN" | "ERR" | "DBG" | "TXT";
    raw: string;
}

export const LogViewerDashboard = () => {
    const getTodayString = (): string => new Date().toISOString().split("T")[0];

    const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

    // FIX: Explicitly type the state array to prevent the 'never' type conversion error
    const [logLines, setLogLines] = useState<LogLineItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // FIX: Type the reference container element explicitly for layout scroll bindings
    const scrollRef = useRef<HTMLDivElement | null>(null);

    // FIX: Added explicit string and number parameter signatures to line rendering handlers
    const parseLogContent = (rawText: string): LogLineItem[] => {
        if (!rawText || !rawText.trim()) return [];

        return rawText.split(/\r?\n/).map((line: string, index: number): LogLineItem => {
            const cleanLine = line.trim();

            if (cleanLine.startsWith("Checked Locations:") || cleanLine.startsWith("- ")) {
                return { id: `line-${index}`, type: "fallback", level: "DBG", raw: line };
            }

            let level: LogLineItem["level"] = "TXT";
            if (cleanLine.includes("[INF]") || cleanLine.toLowerCase().includes("info")) level = "INF";
            else if (cleanLine.includes("[WRN]") || cleanLine.toLowerCase().includes("warn")) level = "WRN";
            else if (cleanLine.includes("[ERR]") || cleanLine.toLowerCase().includes("fail")) level = "ERR";

            return {
                id: `line-${index}`,
                type: "line",
                level,
                raw: line,
            };
        });
    };

    // FIX: Assigned concrete parameter types and integrated your explicit Axios apiService module wrapper
    const fetchLogStream = async (dateTarget: string): Promise<void> => {
        if (!dateTarget) return;
        setLoading(true);
        try {
            const textOutput = await logApi.getLogs(dateTarget);
            setLogLines(parseLogContent(textOutput));
        } catch (err) {
            setLogLines([
                {
                    id: "err",
                    type: "line",
                    level: "ERR",
                    raw: "[ERR] Critical network fault cutting off backend controller link."
                }
            ]);
        } {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogStream(selectedDate);
    }, [selectedDate]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logLines]);

    return (
        <div className="mx-auto max-w-8xl space-y-6 p-6 font-sans antialiased">
            <div className="flex flex-col items-start justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        System Monitoring Log Viewer
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Browse environment tracking metrics and diagnostic logs by date.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-sm font-medium text-slate-700 outline-hidden"
                        />
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => fetchLogStream(selectedDate)}
                        disabled={loading}
                        className="gap-2 border-slate-200 bg-white text-slate-700 shadow-xs"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh Stream
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-slate-200 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-slate-500" />
                        <CardTitle className="text-sm font-semibold text-slate-700">
                            Console Logs Output ({selectedDate})
                        </CardTitle>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 font-mono text-xs text-slate-600">
                        {logLines.length} lines parsed
                    </span>
                </CardHeader>

                <CardContent className="bg-slate-950 p-0">
                    <ScrollArea className="h-150 w-full p-4 font-mono text-xs leading-relaxed selection:bg-slate-800">
                        {logLines.length > 0 ? (
                            <div className="space-y-1">
                                {logLines.map((line: LogLineItem) => {
                                    if (line.type === "fallback") {
                                        return (
                                            <div key={line.id} className="text-slate-500 italic pl-2 py-0.5">
                                                {line.raw}
                                            </div>
                                        );
                                    }

                                    let rowColor = "text-slate-300";
                                    if (line.level === "INF") rowColor = "text-emerald-400";
                                    if (line.level === "WRN") rowColor = "text-amber-400 bg-amber-950/20 px-1 rounded-xs";
                                    if (line.level === "ERR") rowColor = "text-rose-400 bg-rose-950/40 px-1 rounded-xs font-semibold";

                                    return (
                                        <div
                                            key={line.id}
                                            className={`rounded-xs px-1 py-0.5 break-all whitespace-pre-wrap transition-colors hover:bg-slate-900/60 ${rowColor}`}
                                        >
                                            {line.raw}
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        ) : (
                            <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-500 italic">
                                <AlertCircle className="h-5 w-5 text-slate-600" />
                                <span>No active file assets loaded. Adjust targeted search date.</span>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
