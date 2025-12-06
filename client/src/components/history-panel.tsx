import { useQuery } from "@tanstack/react-query";
import { History, Clock, Play, AlertCircle, CheckCircle, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type ExecutionHistory, type ExecutionMode } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface HistoryPanelProps {
  onReplay: (code: string, mode: ExecutionMode) => void;
}

export function HistoryPanel({ onReplay }: HistoryPanelProps) {
  const { data: history = [], isLoading } = useQuery<ExecutionHistory[]>({
    queryKey: ["/api/history"],
    refetchInterval: 10000,
  });

  return (
    <div className="h-full flex flex-col bg-card" data-testid="history-panel">
      <div className="flex items-center justify-between h-9 px-3 border-b border-border bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Execution History</span>
          {history.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {history.length}
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {isLoading ? (
            <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <History className="h-8 w-8 opacity-50" />
              <span>No execution history</span>
              <span className="text-xs">Run some code to see history here</span>
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="group rounded-md border border-border bg-background p-2.5 hover-elevate cursor-pointer"
                onClick={() => onReplay(entry.code, entry.mode as ExecutionMode)}
                data-testid={`history-item-${entry.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {entry.success ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {entry.mode === "nodejs" ? "Node" : "Browser"}
                      </Badge>
                      {entry.executionTime && (
                        <span className="text-xs text-muted-foreground">
                          {entry.executionTime}ms
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5">
                      <pre className="text-xs text-muted-foreground font-mono line-clamp-2 whitespace-pre-wrap">
                        {entry.code.slice(0, 100)}{entry.code.length > 100 ? "..." : ""}
                      </pre>
                    </div>
                    {entry.error && (
                      <p className="text-xs text-destructive mt-1 line-clamp-1">
                        {entry.error}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReplay(entry.code, entry.mode as ExecutionMode);
                          }}
                          data-testid={`button-replay-${entry.id}`}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Load and run</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}