---
name: visual-test
description: Visual testing workflow using dev-browser MCP. Use when testing UI changes, capturing screenshots, verifying responsive design, or recording interactions. Triggers on "test visually", "check the UI", "screenshot", "responsive test", "visual regression".
allowed-tools: [mcp__claude-in-chrome__*, Bash, Read]
---

# Visual Testing Skill

Browser-based visual testing using `mcp__claude-in-chrome__*` tools.

## Headless Mode Setup

### macOS
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --remote-debugging-port=9222 \
  --disable-gpu \
  --window-size=1440,900 \
  --no-sandbox
```

### Linux
```bash
google-chrome \
  --headless=new \
  --remote-debugging-port=9222 \
  --disable-gpu \
  --window-size=1440,900 \
  --no-sandbox
```

### Verify Connection
```bash
curl http://localhost:9222/json/version
```

## Workflow Selection

```
Visual Testing Task?
├── Need screenshots? → Snapshot Workflow
├── Testing responsive? → Responsive Workflow
├── Recording interaction? → Animation Workflow
├── Comparing changes? → Regression Workflow
└── Debugging layout? → read_page + find + zoom
```

## Workflows

### A. Visual Snapshot
1. `tabs_context_mcp(createIfEmpty: true)` → Get/create tab
2. `navigate(url, tabId)` → Load target page
3. `computer("screenshot", tabId)` → Capture baseline
4. Make changes or interact
5. `computer("screenshot", tabId)` → Capture result

### B. Responsive Testing
Standard viewports:
- Mobile: 375x667
- Tablet: 768x1024
- Desktop: 1440x900

For each viewport:
1. `resize_window(width, height, tabId)`
2. `computer("screenshot", tabId)`
3. Save with viewport suffix: `{page}_{viewport}.png`

### C. Animation/Interaction Recording
1. `gif_creator("start_recording", tabId)`
2. `computer("screenshot", tabId)` → Initial frame
3. Perform interactions (scroll, click, hover)
4. `computer("screenshot", tabId)` → Each state change
5. `gif_creator("stop_recording", tabId)`
6. `gif_creator("export", { download: true }, tabId)`

### D. Visual Regression Check
1. Navigate to page
2. `read_page(tabId)` → Get accessibility tree
3. `find("element description", tabId)` → Locate elements
4. `computer("zoom", { region: [x0, y0, x1, y1] }, tabId)` → Inspect details
5. Compare against expected state

## Tool Reference

| Tool | Purpose |
|------|---------|
| `tabs_context_mcp` | Get tab context, create tab group |
| `tabs_create_mcp` | Create new tab |
| `navigate` | Load URL |
| `resize_window` | Set viewport size |
| `computer` | screenshot, click, scroll, zoom, hover |
| `read_page` | Get accessibility tree |
| `find` | Locate elements by description |
| `gif_creator` | Record/export animations |
| `read_console_messages` | Check for JS errors |

## Best Practices

1. **Always start with `tabs_context_mcp`** to get valid tab ID
2. **Take baseline screenshot** before any interaction
3. **Use `read_console_messages`** to catch JS errors
4. **Descriptive names**: `{page}_{viewport}_{state}.png`
5. **Headless requires `--window-size`** to control viewport

## Example Usage

```
/visual-test check homepage responsive design
/visual-test screenshot the login form
/visual-test record interaction with the navigation menu
/visual-test verify layout on mobile viewport
```
