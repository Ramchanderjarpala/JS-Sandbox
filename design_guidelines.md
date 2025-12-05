# Design Guidelines: Real-Time JavaScript Compiler

## Design Approach

**Selected Approach:** Design System with Reference Inspiration

**Primary References:** VS Code, CodeSandbox, Replit, StackBlitz

**Justification:** This is a utility-focused developer tool requiring efficiency, learnability, and standard IDE patterns. Developers expect familiar code editor conventions with minimal visual distraction.

**Core Principles:**
- Function-first design with zero visual clutter
- Established IDE patterns for instant familiarity  
- Maximum screen real estate for code and output
- High information density with clear hierarchy

---

## Typography System

**Font Families:**
- **Interface:** Inter (Google Fonts) - All UI elements, buttons, labels
- **Code:** JetBrains Mono (Google Fonts) - Editor and terminal content
- **Headers:** Inter SemiBold - Section titles, panel headers

**Type Scale:**
- Code/Terminal: text-sm (14px) - Primary monospace content
- UI Labels: text-xs (12px) - Secondary interface text
- Panel Headers: text-base font-semibold (16px) - Section identifiers
- Button Text: text-sm font-medium - Action elements

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 3, 4, 6, 8

**Application Structure:**
```
[Top Navigation Bar - h-12]
[Main Workspace - flex-1]
  ├─ [Editor Panel - 50-70% width]
  └─ [Terminal Panel - 30-50% width]
```

**Key Spacing Rules:**
- Panel padding: p-0 (editors fill entire space)
- Navigation padding: px-4 py-3
- Button spacing: px-4 py-2
- Icon spacing: gap-2 for icon+text combinations
- Panel dividers: Resizable with 1px separator

---

## Component Library

### Navigation Bar (Top Fixed - h-12)
- Logo/title on left
- Execution mode toggle (Node.js / Browser) center-left
- Run button (prominent, center-right)
- Settings icon (top-right)
- Layout: flex items-center justify-between px-4

### Code Editor Panel
- Monaco Editor integration filling entire panel
- Line numbers enabled
- Minimap on right edge
- Tab bar if multiple files (future): h-8 tabs
- No padding around editor content
- Status bar at bottom: h-6 showing cursor position, language

### Terminal Panel  
- xterm.js integration filling panel space
- Clear output button (top-right corner of panel)
- Terminal header showing "Console Output": h-8 px-3
- Direct terminal content below with p-2 inner padding

### Execution Controls
- Large "Run Code" button: rounded-md px-6 py-2 font-medium
- Mode switcher: Segmented control (Node.js | Browser) rounded-lg p-1
- Auto-run toggle: Small switch with label

### Resizable Divider
- Vertical draggable separator between panels
- 4px wide active grab area
- Hover state indication
- Cursor changes to col-resize

### Error Display
- Inline editor errors: Squiggly underlines (Monaco native)
- Terminal error output: Distinct error formatting in xterm
- Error panel (if needed): Bottom drawer, h-32, collapsible

### Settings Panel (Overlay)
- Dropdown or modal overlay: max-w-md
- Theme selection
- Font size controls  
- Auto-run preferences
- Keyboard shortcuts reference

---

## Layout Specifications

### Desktop Primary Layout (≥1024px)
```
Navigation: Full width, h-12
Workspace: flex flex-row h-[calc(100vh-3rem)]
├─ Editor: w-7/12 (resizable 50-70%)
└─ Terminal: w-5/12 (resizable 30-50%)
```

### Tablet/Small Desktop (768-1023px)
```
Navigation: Full width, h-12  
Workspace: flex flex-col h-[calc(100vh-3rem)]
├─ Editor: h-1/2 (resizable 40-60%)
└─ Terminal: h-1/2 (resizable 40-60%)
Orientation: Vertical split
```

### Mobile (<768px)
```
Navigation: Compact, h-12
Tab switcher: Toggle between Editor/Terminal views
Active panel: Full viewport height
```

---

## Interaction Patterns

**Panel Resizing:**
- Smooth drag interaction on divider
- Snap to minimum widths (300px editor, 250px terminal)
- Persist resize preferences in localStorage

**Code Execution Flow:**
1. Click Run or Ctrl+Enter
2. Terminal clears (optional based on settings)  
3. Loading indicator in Run button
4. Output streams to terminal in real-time
5. Completion state shown (success/error)

**Keyboard Shortcuts:**
- Display shortcuts guide: Cmd/Ctrl + K
- Run code: Cmd/Ctrl + Enter
- Clear terminal: Cmd/Ctrl + K
- Toggle mode: Cmd/Ctrl + Shift + M

---

## Animations

**Minimal Animation Strategy:**

Essential only:
- Panel resize: Smooth transform with 150ms ease
- Run button: Subtle press state (scale-95)
- Mode toggle: 200ms slide transition
- Settings panel: 200ms fade-in

**Explicitly Avoid:**
- Loading spinners (use progress bars)
- Elaborate transitions
- Decorative animations

---

## Accessibility

- All controls keyboard navigable
- Clear focus indicators (2px outline offset)
- ARIA labels on icon-only buttons
- Terminal output screen-reader compatible
- High contrast mode support via Monaco/xterm theming

---

## Visual Hierarchy

**Priority Levels:**
1. **Primary:** Code editor content - Maximum visual weight
2. **Secondary:** Terminal output - Immediate feedback visibility  
3. **Tertiary:** Navigation controls - Available but unobtrusive
4. **Quaternary:** Settings/preferences - Hidden until needed