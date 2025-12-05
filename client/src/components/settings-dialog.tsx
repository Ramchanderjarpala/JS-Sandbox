import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditorSettings } from "@shared/schema";
import { RotateCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: EditorSettings;
  onUpdateSetting: <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => void;
  onReset: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onUpdateSetting,
  onReset,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="settings-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editor Settings</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="gap-1.5 text-xs"
              data-testid="button-reset-settings"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="fontSize" className="text-sm">
                  Font Size
                </Label>
                <span className="text-xs text-muted-foreground">
                  {settings.fontSize}px
                </span>
              </div>
              <Slider
                id="fontSize"
                min={10}
                max={24}
                step={1}
                value={[settings.fontSize]}
                onValueChange={([value]) => onUpdateSetting("fontSize", value)}
                data-testid="slider-font-size"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="tabSize" className="text-sm">
                  Tab Size
                </Label>
                <span className="text-xs text-muted-foreground">
                  {settings.tabSize} spaces
                </span>
              </div>
              <Slider
                id="tabSize"
                min={2}
                max={8}
                step={2}
                value={[settings.tabSize]}
                onValueChange={([value]) => onUpdateSetting("tabSize", value)}
                data-testid="slider-tab-size"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="wordWrap" className="text-sm">
                  Word Wrap
                </Label>
                <p className="text-xs text-muted-foreground">
                  Wrap long lines of code
                </p>
              </div>
              <Select
                value={settings.wordWrap}
                onValueChange={(value: "on" | "off") =>
                  onUpdateSetting("wordWrap", value)
                }
              >
                <SelectTrigger className="w-24" data-testid="select-word-wrap">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="minimap" className="text-sm">
                  Minimap
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show code overview on the side
                </p>
              </div>
              <Switch
                id="minimap"
                checked={settings.minimap}
                onCheckedChange={(checked) =>
                  onUpdateSetting("minimap", checked)
                }
                data-testid="switch-minimap"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lineNumbers" className="text-sm">
                  Line Numbers
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show line numbers in editor
                </p>
              </div>
              <Switch
                id="lineNumbers"
                checked={settings.lineNumbers === "on"}
                onCheckedChange={(checked) =>
                  onUpdateSetting("lineNumbers", checked ? "on" : "off")
                }
                data-testid="switch-line-numbers"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoRun" className="text-sm">
                  Auto Run
                </Label>
                <p className="text-xs text-muted-foreground">
                  Execute code on change (debounced)
                </p>
              </div>
              <Switch
                id="autoRun"
                checked={settings.autoRun}
                onCheckedChange={(checked) =>
                  onUpdateSetting("autoRun", checked)
                }
                data-testid="switch-auto-run"
              />
            </div>
          </div>

          <Separator />

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Keyboard Shortcuts</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">
                  Ctrl + Enter
                </kbd>
                <span className="text-muted-foreground">Run code</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px] font-mono">
                  Ctrl + S
                </kbd>
                <span className="text-muted-foreground">Save code</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
