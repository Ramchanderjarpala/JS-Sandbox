import { useEffect, useRef, useCallback } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { TerminalOutput } from "@shared/schema";
import { useTheme } from "@/lib/theme-provider";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TerminalProps {
  outputs: TerminalOutput[];
  onClear: () => void;
  isExecuting: boolean;
}

const THEMES = {
  dark: {
    background: "#16181d",
    foreground: "#e4e4e7",
    cursor: "#3b82f6",
    cursorAccent: "#16181d",
    selectionBackground: "#3b82f680",
    selectionForeground: "#ffffff",
    selectionInactiveBackground: "#3b82f640",
    black: "#16181d",
    red: "#ef4444",
    green: "#22c55e",
    yellow: "#eab308",
    blue: "#3b82f6",
    magenta: "#a855f7",
    cyan: "#06b6d4",
    white: "#e4e4e7",
    brightBlack: "#52525b",
    brightRed: "#f87171",
    brightGreen: "#4ade80",
    brightYellow: "#facc15",
    brightBlue: "#60a5fa",
    brightMagenta: "#c084fc",
    brightCyan: "#22d3ee",
    brightWhite: "#fafafa",
  },
  light: {
    background: "#fafbfc",
    foreground: "#1e293b",
    cursor: "#2563eb",
    cursorAccent: "#fafbfc",
    selectionBackground: "#3b82f640",
    selectionForeground: "#1e293b",
    selectionInactiveBackground: "#3b82f620",
    black: "#1e293b",
    red: "#dc2626",
    green: "#16a34a",
    yellow: "#ca8a04",
    blue: "#2563eb",
    magenta: "#9333ea",
    cyan: "#0891b2",
    white: "#f1f5f9",
    brightBlack: "#64748b",
    brightRed: "#ef4444",
    brightGreen: "#22c55e",
    brightYellow: "#eab308",
    brightBlue: "#3b82f6",
    brightMagenta: "#a855f7",
    brightCyan: "#06b6d4",
    brightWhite: "#ffffff",
  },
};

export function Terminal({ outputs, onClear, isExecuting }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { theme } = useTheme();
  const lastOutputCountRef = useRef(0);

  const formatOutput = useCallback((output: TerminalOutput): string => {
    const colors = {
      log: "\x1b[37m",
      error: "\x1b[31m",
      warn: "\x1b[33m",
      info: "\x1b[36m",
      result: "\x1b[32m",
      system: "\x1b[90m",
    };
    const reset = "\x1b[0m";
    const prefix = {
      log: "",
      error: "[ERROR] ",
      warn: "[WARN] ",
      info: "[INFO] ",
      result: "=> ",
      system: "",
    };

    return `${colors[output.type]}${prefix[output.type]}${output.content}${reset}`;
  }, []);

  useEffect(() => {
    if (!terminalRef.current) return;

    if (xtermRef.current) {
      xtermRef.current.dispose();
    }

    const terminal = new XTerm({
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontSize: 13,
      lineHeight: 1.5,
      letterSpacing: 0,
      cursorBlink: true,
      cursorStyle: "bar",
      theme: THEMES[theme],
      allowTransparency: true,
      scrollback: 1000,
      convertEol: true,
      disableStdin: true,
      rows: 24,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(terminalRef.current);

    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        // Ignore fit errors on initial render
      }
    }, 50);

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (e) {
          // Ignore resize errors
        }
      }
    });

    resizeObserver.observe(terminalRef.current);

    terminal.writeln("\x1b[36m┌─────────────────────────────────────┐\x1b[0m");
    terminal.writeln("\x1b[36m│\x1b[0m   \x1b[1;37mJSPlayground Console\x1b[0m              \x1b[36m│\x1b[0m");
    terminal.writeln("\x1b[36m│\x1b[0m   \x1b[90mPress Ctrl+Enter to run code\x1b[0m      \x1b[36m│\x1b[0m");
    terminal.writeln("\x1b[36m└─────────────────────────────────────┘\x1b[0m");
    terminal.writeln("");

    lastOutputCountRef.current = 0;

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, [theme]);

  useEffect(() => {
    if (!xtermRef.current) return;

    const terminal = xtermRef.current;
    const newOutputs = outputs.slice(lastOutputCountRef.current);
    
    newOutputs.forEach((output) => {
      const formatted = formatOutput(output);
      const lines = formatted.split("\n");
      lines.forEach((line) => {
        terminal.writeln(line);
      });
    });

    lastOutputCountRef.current = outputs.length;
  }, [outputs, formatOutput]);

  const handleClear = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln("\x1b[90m─── Console cleared ───\x1b[0m");
      xtermRef.current.writeln("");
    }
    lastOutputCountRef.current = 0;
    onClear();
  }, [onClear]);

  return (
    <div className="h-full flex flex-col bg-card" data-testid="terminal-container">
      <div className="flex items-center justify-between h-9 px-3 border-b border-border bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs font-medium text-muted-foreground" data-testid="text-console-title">
            Console Output
          </span>
          {isExecuting && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs text-primary font-medium">Running...</span>
            </div>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-7 w-7"
              data-testid="button-clear-terminal"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Clear console</TooltipContent>
        </Tooltip>
      </div>
      <div 
        ref={terminalRef} 
        className="flex-1 p-2 min-h-0"
        style={{ minHeight: "100px" }}
        data-testid="terminal-output"
      />
    </div>
  );
}
