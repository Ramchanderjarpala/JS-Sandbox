import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface ResizablePanelsProps {
  editor: React.ReactNode;
  terminal: React.ReactNode;
  direction?: "horizontal" | "vertical";
}

export function ResizablePanels({
  editor,
  terminal,
  direction = "horizontal",
}: ResizablePanelsProps) {
  return (
    <ResizablePanelGroup
      direction={direction}
      className="h-full"
      data-testid="resizable-panels"
    >
      <ResizablePanel
        defaultSize={60}
        minSize={30}
        maxSize={80}
        className="relative"
        data-testid="panel-editor"
      >
        {editor}
      </ResizablePanel>
      <ResizableHandle 
        withHandle 
        className="bg-border data-[resize-handle-state=hover]:bg-primary/20 data-[resize-handle-state=drag]:bg-primary/30 transition-colors" 
        data-testid="resize-handle" 
      />
      <ResizablePanel
        defaultSize={40}
        minSize={20}
        maxSize={60}
        className="relative"
        data-testid="panel-terminal"
      >
        {terminal}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
