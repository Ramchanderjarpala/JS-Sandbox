import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Copy, 
  Check, 
  Plus, 
  Clock,
  FileCode,
  Link2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Snippet, type ExecutionMode } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface SnippetsPanelProps {
  currentCode: string;
  currentMode: ExecutionMode;
  onLoadSnippet: (code: string, mode: ExecutionMode) => void;
}

export function SnippetsPanel({ currentCode, currentMode, onLoadSnippet }: SnippetsPanelProps) {
  const { toast } = useToast();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snippetToDelete, setSnippetToDelete] = useState<Snippet | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: snippets = [], isLoading } = useQuery<Snippet[]>({
    queryKey: ["/api/snippets"],
  });

  const createSnippetMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; code: string; mode: string }) => {
      return apiRequest("POST", "/api/snippets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
      setSaveDialogOpen(false);
      setTitle("");
      setDescription("");
      toast({
        title: "Snippet saved",
        description: "Your code snippet has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save",
        description: "There was an error saving your snippet.",
        variant: "destructive",
      });
    },
  });

  const deleteSnippetMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/snippets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
      setDeleteDialogOpen(false);
      setSnippetToDelete(null);
      toast({
        title: "Snippet deleted",
        description: "Your code snippet has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete",
        description: "There was an error deleting your snippet.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your snippet.",
        variant: "destructive",
      });
      return;
    }
    createSnippetMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      code: currentCode,
      mode: currentMode,
    });
  };

  const handleCopyLink = async (snippet: Snippet) => {
    const url = `${window.location.origin}/?s=${snippet.shortId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(snippet.shortId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Link copied",
      description: "Shareable link copied to clipboard.",
    });
  };

  const handleDelete = (snippet: Snippet) => {
    setSnippetToDelete(snippet);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-card" data-testid="snippets-panel">
      <div className="flex items-center justify-between h-9 px-3 border-b border-border bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Saved Snippets</span>
          {snippets.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {snippets.length}
            </Badge>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSaveDialogOpen(true)}
              data-testid="button-save-snippet"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Save current code</TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {isLoading ? (
            <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
              Loading snippets...
            </div>
          ) : snippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <FileCode className="h-8 w-8 opacity-50" />
              <span>No saved snippets</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSaveDialogOpen(true)}
                className="gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                Save current code
              </Button>
            </div>
          ) : (
            snippets.map((snippet) => (
              <div
                key={snippet.id}
                className="group rounded-md border border-border bg-background p-2.5 hover-elevate cursor-pointer"
                onClick={() => onLoadSnippet(snippet.code, snippet.mode as ExecutionMode)}
                data-testid={`snippet-item-${snippet.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate" data-testid={`text-snippet-title-${snippet.id}`}>
                        {snippet.title}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {snippet.mode === "nodejs" ? "Node" : "Browser"}
                      </Badge>
                    </div>
                    {snippet.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {snippet.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(snippet.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(snippet);
                          }}
                          data-testid={`button-copy-link-${snippet.id}`}
                        >
                          {copiedId === snippet.shortId ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Link2 className="h-3 w-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy shareable link</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(snippet);
                          }}
                          data-testid={`button-delete-snippet-${snippet.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete snippet</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent data-testid="save-snippet-dialog">
          <DialogHeader>
            <DialogTitle>Save Snippet</DialogTitle>
            <DialogDescription>
              Save your current code as a reusable snippet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                placeholder="My awesome code..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-snippet-title"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="description"
                placeholder="What does this code do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                data-testid="input-snippet-description"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{currentMode === "nodejs" ? "Node.js" : "Browser"}</Badge>
              <span>{currentCode.split("\n").length} lines</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createSnippetMutation.isPending}
              data-testid="button-confirm-save"
            >
              {createSnippetMutation.isPending ? "Saving..." : "Save Snippet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snippet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{snippetToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => snippetToDelete && deleteSnippetMutation.mutate(snippetToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteSnippetMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
