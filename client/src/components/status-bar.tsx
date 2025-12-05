import { ExecutionMode } from "@shared/schema";
import { Server, Globe, FileCode } from "lucide-react";

interface StatusBarProps {
  mode: ExecutionMode;
  cursorPosition?: { line: number; column: number };
}

export function StatusBar({ mode, cursorPosition }: StatusBarProps) {
  return (
    <div
      className="h-6 px-3 flex items-center justify-between gap-4 text-xs text-muted-foreground bg-muted/30 border-t border-border flex-shrink-0"
      data-testid="status-bar"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <FileCode className="h-3 w-3" />
          <span>JavaScript</span>
        </div>
        {cursorPosition && (
          <span data-testid="text-cursor-position">
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {mode === "nodejs" ? (
          <>
            <Server className="h-3 w-3" />
            <span>Node.js Runtime</span>
          </>
        ) : (
          <>
            <Globe className="h-3 w-3" />
            <span>Browser Runtime</span>
          </>
        )}
      </div>
    </div>
  );
}
