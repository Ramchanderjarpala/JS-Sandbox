import { useState, useCallback, useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { CodeEditor } from "@/components/code-editor";
import { Terminal } from "@/components/terminal";
import { SettingsDialog } from "@/components/settings-dialog";
import { ResizablePanels } from "@/components/resizable-panels";
import { StatusBar } from "@/components/status-bar";
import { useEditorSettings } from "@/hooks/use-editor-settings";
import { useCodeStorage } from "@/hooks/use-code-storage";
import { ExecutionMode, TerminalOutput } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Playground() {
  const [mode, setMode] = useState<ExecutionMode>("nodejs");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const { settings, updateSetting, resetSettings } = useEditorSettings();
  const { code, setCode } = useCodeStorage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const autoRunTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const executeMutation = useMutation({
    mutationFn: async (payload: { code: string; mode: ExecutionMode }) => {
      const response = await apiRequest("POST", "/api/execute", payload);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.output && Array.isArray(data.output)) {
        const newOutputs: TerminalOutput[] = data.output.map(
          (item: { type: string; content: string }) => ({
            type: item.type as TerminalOutput["type"],
            content: item.content,
            timestamp: Date.now(),
          })
        );
        setOutputs((prev) => [...prev, ...newOutputs]);
      }

      if (data.error) {
        setOutputs((prev) => [
          ...prev,
          {
            type: "error" as const,
            content: data.error,
            timestamp: Date.now(),
          },
        ]);
      }

      if (data.executionTime) {
        setOutputs((prev) => [
          ...prev,
          {
            type: "system" as const,
            content: `Execution completed in ${data.executionTime}ms`,
            timestamp: Date.now(),
          },
        ]);
      }
    },
    onError: (error) => {
      toast({
        title: "Execution Error",
        description: error instanceof Error ? error.message : "Failed to execute code",
        variant: "destructive",
      });
      setOutputs((prev) => [
        ...prev,
        {
          type: "error" as const,
          content: error instanceof Error ? error.message : "Failed to execute code",
          timestamp: Date.now(),
        },
      ]);
    },
  });

  const handleRun = useCallback(() => {
    if (!code.trim()) {
      toast({
        title: "Empty Code",
        description: "Please write some code before running",
        variant: "destructive",
      });
      return;
    }

    setOutputs((prev) => [
      ...prev,
      {
        type: "system" as const,
        content: `\n--- Running in ${mode === "nodejs" ? "Node.js" : "Browser"} mode ---`,
        timestamp: Date.now(),
      },
    ]);

    executeMutation.mutate({ code, mode });
  }, [code, mode, executeMutation, toast]);

  const handleClearTerminal = useCallback(() => {
    setOutputs([]);
  }, []);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);

      if (settings.autoRun) {
        if (autoRunTimeoutRef.current) {
          clearTimeout(autoRunTimeoutRef.current);
        }
        autoRunTimeoutRef.current = setTimeout(() => {
          if (newCode.trim()) {
            executeMutation.mutate({ code: newCode, mode });
          }
        }, 1000);
      }
    },
    [setCode, settings.autoRun, executeMutation, mode]
  );

  useEffect(() => {
    return () => {
      if (autoRunTimeoutRef.current) {
        clearTimeout(autoRunTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun]);

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="playground-container">
      <Navbar
        mode={mode}
        onModeChange={setMode}
        onRun={handleRun}
        onOpenSettings={() => setSettingsOpen(true)}
        isExecuting={executeMutation.isPending}
      />

      <div className="flex-1 min-h-0">
        <ResizablePanels
          direction={isMobile ? "vertical" : "horizontal"}
          editor={
            <div className="h-full flex flex-col">
              <CodeEditor
                value={code}
                onChange={handleCodeChange}
                settings={settings}
                onRun={handleRun}
              />
            </div>
          }
          terminal={
            <Terminal
              outputs={outputs}
              onClear={handleClearTerminal}
              isExecuting={executeMutation.isPending}
            />
          }
        />
      </div>

      <StatusBar mode={mode} />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onUpdateSetting={updateSetting}
        onReset={resetSettings}
      />
    </div>
  );
}
