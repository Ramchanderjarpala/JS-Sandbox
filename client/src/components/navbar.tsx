import { Play, Settings, Moon, Sun, Code2, Server, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-provider";
import { ExecutionMode } from "@shared/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavbarProps {
  mode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
  onRun: () => void;
  onOpenSettings: () => void;
  isExecuting: boolean;
}

export function Navbar({
  mode,
  onModeChange,
  onRun,
  onOpenSettings,
  isExecuting,
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="h-12 px-4 flex items-center justify-between gap-4 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0" data-testid="navbar">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/15 border border-primary/20">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <span className="text-base font-semibold tracking-tight hidden sm:inline" data-testid="text-app-title">
            JSPlayground
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border" data-testid="mode-toggle">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === "nodejs" ? "secondary" : "ghost"}
                size="sm"
                className={`gap-1.5 px-3 text-xs font-medium transition-all ${
                  mode === "nodejs" ? "shadow-sm" : ""
                }`}
                onClick={() => onModeChange("nodejs")}
                data-testid="button-mode-nodejs"
              >
                <Server className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Node.js</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Run in Node.js environment</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === "browser" ? "secondary" : "ghost"}
                size="sm"
                className={`gap-1.5 px-3 text-xs font-medium transition-all ${
                  mode === "browser" ? "shadow-sm" : ""
                }`}
                onClick={() => onModeChange("browser")}
                data-testid="button-mode-browser"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Browser</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Run in Browser environment</TooltipContent>
          </Tooltip>
        </div>

        <Button
          onClick={onRun}
          disabled={isExecuting}
          className="gap-2 px-5 font-medium shadow-sm"
          data-testid="button-run-code"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Running...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Run</span>
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-toggle-theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              data-testid="button-open-settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editor settings</TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}
