# JSPlayground - Real-Time JavaScript Compiler

## Overview
A powerful real-time web-based JavaScript compiler with an advanced Monaco code editor, dual execution environments (Node.js and browser), and a modern xterm.js terminal interface.

## Current State
- **Status**: MVP Complete
- **Last Updated**: December 2024

## Project Architecture

### Frontend (client/)
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query + React hooks
- **Styling**: Tailwind CSS with shadcn/ui components
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **Terminal**: xterm.js (@xterm/xterm)

### Backend (server/)
- **Framework**: Express.js
- **Code Execution**: Node.js VM module for sandboxed execution
- **API**: RESTful endpoint for code execution

### Shared (shared/)
- **Schema**: TypeScript types and Zod schemas for type safety

## Key Features
1. **Advanced Code Editor**
   - Monaco Editor with full IntelliSense
   - Syntax highlighting and error detection
   - Customizable settings (font size, tab size, minimap, etc.)
   - Keyboard shortcuts (Ctrl+Enter to run)

2. **Dual Execution Modes**
   - Node.js: Access to Node.js globals (Buffer, process, etc.)
   - Browser: Access to browser APIs (window, document, localStorage)

3. **Modern Terminal**
   - xterm.js integration
   - Colored output (errors in red, warnings in yellow, etc.)
   - Execution time display
   - Clear terminal functionality

4. **Settings & Preferences**
   - Font size adjustment
   - Tab size configuration
   - Word wrap toggle
   - Minimap toggle
   - Line numbers toggle
   - Auto-run on change option
   - Light/dark theme toggle

## API Endpoints

### POST /api/execute
Execute JavaScript code in a sandboxed environment.

**Request Body:**
```json
{
  "code": "console.log('Hello World')",
  "mode": "nodejs" | "browser"
}
```

**Response:**
```json
{
  "success": true,
  "output": [
    { "type": "log", "content": "Hello World" }
  ],
  "executionTime": 5
}
```

## File Structure
```
client/
├── src/
│   ├── components/
│   │   ├── code-editor.tsx    # Monaco Editor wrapper
│   │   ├── terminal.tsx       # xterm.js terminal
│   │   ├── navbar.tsx         # Top navigation
│   │   ├── settings-dialog.tsx # Settings modal
│   │   ├── resizable-panels.tsx # Split panel layout
│   │   └── status-bar.tsx     # Bottom status bar
│   ├── hooks/
│   │   ├── use-editor-settings.ts
│   │   └── use-code-storage.ts
│   ├── lib/
│   │   └── theme-provider.tsx
│   ├── pages/
│   │   └── playground.tsx     # Main page
│   └── App.tsx
server/
├── routes.ts                   # API routes with code execution
└── storage.ts                  # In-memory storage
shared/
└── schema.ts                   # Types and schemas
```

## Development

### Running the Application
The app runs on port 5000 with Vite for the frontend and Express for the backend.

### Environment Variables
- No external API keys required
- SESSION_SECRET for session management

## User Preferences
- Default theme: Dark
- All preferences persist to localStorage
- Code is auto-saved to localStorage

## Recent Changes
- Initial MVP implementation
- Monaco Editor integration with IntelliSense
- xterm.js terminal with colored output
- Sandboxed code execution for Node.js and browser modes
- Resizable split panels
- Settings dialog with customization options
- Light/dark theme support
