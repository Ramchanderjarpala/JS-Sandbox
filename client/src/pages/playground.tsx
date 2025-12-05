import { useState, useCallback, useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { CodeEditor } from "@/components/code-editor";
import { Terminal } from "@/components/terminal";
import { SettingsDialog } from "@/components/settings-dialog";
import { SnippetsPanel } from "@/components/snippets-panel";
import { HistoryPanel } from "@/components/history-panel";
import { StatusBar } from "@/components/status-bar";
import { useEditorSettings } from "@/hooks/use-editor-settings";
import { useCodeStorage } from "@/hooks/use-code-storage";
import { ExecutionMode, TerminalOutput } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { FileCode, History, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function Playground() {
  const [mode, setMode] = useState<ExecutionMode>("nodejs");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("snippets");
  const { settings, updateSetting, resetSettings } = useEditorSettings();
  const { code, setCode } = useCodeStorage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const autoRunTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const snippetId = params.get("s");
    if (snippetId) {
      fetch(`/api/snippets/${snippetId}`)
        .then((res) => res.json())
        .then((snippet) => {
          if (snippet && snippet.code) {
            setCode(snippet.code);
            setMode(snippet.mode as ExecutionMode);
            toast({
              title: "Snippet loaded",
              description: `Loaded "${snippet.title}"`,
            });
            window.history.replaceState({}, "", "/");
          }
        })
        .catch(() => {
          toast({
            title: "Snippet not found",
            description: "The shared snippet could not be loaded.",
            variant: "destructive",
          });
        });
    }
  }, [setCode, toast]);

  const executeMutation = useMutation({
    mutationFn: async (payload: { code: string; mode: ExecutionMode }) => {
      const response = await apiRequest("POST", "/api/execute", payload);
      return response.json();
    },
    onSuccess: (data, variables) => {
      const newOutputs: TerminalOutput[] = [];
      
      if (data.output && Array.isArray(data.output)) {
        data.output.forEach((item: { type: string; content: string }) => {
          newOutputs.push({
            type: item.type as TerminalOutput["type"],
            content: item.content,
            timestamp: Date.now(),
          });
        });
      }

      if (data.error) {
        newOutputs.push({
          type: "error" as const,
          content: data.error,
          timestamp: Date.now(),
        });
      }

      if (data.executionTime) {
        newOutputs.push({
          type: "system" as const,
          content: `Execution completed in ${data.executionTime}ms`,
          timestamp: Date.now(),
        });
      }

      setOutputs((prev) => [...prev, ...newOutputs]);

      apiRequest("POST", "/api/history", {
        code: variables.code,
        mode: variables.mode,
        output: newOutputs,
        executionTime: data.executionTime,
        success: !data.error,
        error: data.error,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      }).catch(() => {});
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

  const handleLoadSnippet = useCallback((snippetCode: string, snippetMode: ExecutionMode) => {
    setCode(snippetCode);
    setMode(snippetMode);
    toast({
      title: "Snippet loaded",
      description: "Code loaded into editor.",
    });
  }, [setCode, toast]);

  const handleReplayHistory = useCallback((historyCode: string, historyMode: ExecutionMode) => {
    setCode(historyCode);
    setMode(historyMode);
    setTimeout(() => {
      executeMutation.mutate({ code: historyCode, mode: historyMode });
    }, 100);
  }, [setCode, executeMutation]);

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

  const SidePanel = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      <div className="flex items-center justify-between px-2 h-10 border-b border-border bg-muted/30 shrink-0">
        <TabsList className="h-7 p-0.5">
          <TabsTrigger value="snippets" className="text-xs gap-1 px-2 h-6" data-testid="tab-snippets">
            <FileCode className="h-3 w-3" />
            <span className="hidden sm:inline">Snippets</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1 px-2 h-6" data-testid="tab-history">
            <History className="h-3 w-3" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSidebarCollapsed(true)}
              data-testid="button-collapse-sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Hide sidebar</TooltipContent>
        </Tooltip>
      </div>
      <TabsContent value="snippets" className="flex-1 m-0 p-0 overflow-hidden">
        <SnippetsPanel
          currentCode={code}
          currentMode={mode}
          onLoadSnippet={handleLoadSnippet}
        />
      </TabsContent>
      <TabsContent value="history" className="flex-1 m-0 p-0 overflow-hidden">
        <HistoryPanel onReplay={handleReplayHistory} />
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="playground-container">
      <Navbar
        mode={mode}
        onModeChange={setMode}
        onRun={handleRun}
        onOpenSettings={() => setSettingsOpen(true)}
        isExecuting={executeMutation.isPending}
      />

      <div className="flex-1 min-h-0 flex">
        {sidebarCollapsed && !isMobile && (
          <div className="w-10 border-r border-border bg-card flex flex-col items-center py-2 gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSidebarCollapsed(false)}
                  data-testid="button-expand-sidebar"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Show sidebar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === "snippets" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setActiveTab("snippets");
                    setSidebarCollapsed(false);
                  }}
                  data-testid="button-sidebar-snippets"
                >
                  <FileCode className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Snippets</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === "history" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setActiveTab("history");
                    setSidebarCollapsed(false);
                  }}
                  data-testid="button-sidebar-history"
                >
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">History</TooltipContent>
            </Tooltip>
          </div>
        )}

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {!sidebarCollapsed && !isMobile && (
            <>
              <ResizablePanel
                defaultSize={20}
                minSize={15}
                maxSize={35}
                className="bg-card"
                data-testid="panel-sidebar"
              >
                {SidePanel}
              </ResizablePanel>
              <ResizableHandle className="bg-border data-[resize-handle-state=hover]:bg-primary/20 data-[resize-handle-state=drag]:bg-primary/30 transition-colors" />
            </>
          )}
          <ResizablePanel defaultSize={sidebarCollapsed || isMobile ? 100 : 80} minSize={50}>
            <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"}>
              <ResizablePanel
                defaultSize={60}
                minSize={30}
                maxSize={80}
                data-testid="panel-editor"
              >
                <div className="h-full flex flex-col">
                  <CodeEditor
                    value={code}
                    onChange={handleCodeChange}
                    settings={settings}
                    onRun={handleRun}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle 
                withHandle 
                className="bg-border data-[resize-handle-state=hover]:bg-primary/20 data-[resize-handle-state=drag]:bg-primary/30 transition-colors" 
              />
              <ResizablePanel
                defaultSize={40}
                minSize={20}
                maxSize={60}
                data-testid="panel-terminal"
              >
                <Terminal
                  outputs={outputs}
                  onClear={handleClearTerminal}
                  isExecuting={executeMutation.isPending}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
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
