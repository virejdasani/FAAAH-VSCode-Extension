import * as vscode from 'vscode';
import * as path from 'path';
import { execFile } from 'child_process';

let previousErrorCount = 0;
let previousWarningCount = 0;

function getCounts(): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;
  for (const [, diags] of vscode.languages.getDiagnostics()) {
    for (const d of diags) {
      if (d.severity === vscode.DiagnosticSeverity.Error) errors++;
      else if (d.severity === vscode.DiagnosticSeverity.Warning) warnings++;
    }
  }
  return { errors, warnings };
}

function playSound(soundPath: string): void {
  const platform = process.platform;
  if (platform === 'darwin') {
    execFile('afplay', [soundPath]);
  } else if (platform === 'win32') {
    execFile('powershell', ['-c', `(New-Object Media.SoundPlayer '${soundPath}').PlaySync()`]);
  } else {
    execFile('aplay', [soundPath], err => {
      if (err) execFile('paplay', [soundPath]);
    });
  }
}

class FaaaaahViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'faaaaah.settingsView';
  private _view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(msg => {
      if (msg.command === 'save') {
        const cfg = vscode.workspace.getConfiguration('faaaaah');
        cfg.update('minNewErrors', msg.minNewErrors, vscode.ConfigurationTarget.Global);
        cfg.update('warningSoundEnabled', msg.warningSoundEnabled, vscode.ConfigurationTarget.Global);
        cfg.update('minNewWarnings', msg.minNewWarnings, vscode.ConfigurationTarget.Global);
        cfg.update('soundFile', msg.soundFile, vscode.ConfigurationTarget.Global);
        cfg.update('warningSoundFile', msg.warningSoundFile, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('FAAAAAH settings saved.');
      }
    });

    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('faaaaah') && this._view) {
        this._view.webview.html = this.getHtml(this._view.webview);
      }
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const cfg = vscode.workspace.getConfiguration('faaaaah');
    const minNewErrors: number = cfg.get('minNewErrors', 1);
    const warningSoundEnabled: boolean = cfg.get('warningSoundEnabled', false);
    const minNewWarnings: number = cfg.get('minNewWarnings', 1);
    const soundFile: string = cfg.get('soundFile', '');
    const warningSoundFile: string = cfg.get('warningSoundFile', '');

    const nonce = Math.random().toString(36).slice(2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style nonce="${nonce}">
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    padding: 12px 16px;
    margin: 0;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
  }
  .logo-circle {
    width: 40px;
    height: 40px;
    background: #e53935;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 13px;
    color: white;
    flex-shrink: 0;
  }
  .logo-title {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .section {
    margin-bottom: 18px;
  }
  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 8px;
  }
  label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
  }
  input[type="number"], input[type="text"] {
    width: 100%;
    box-sizing: border-box;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, #555);
    padding: 5px 8px;
    border-radius: 3px;
    font-size: 12px;
    margin-bottom: 10px;
  }
  .toggle-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
  }
  .warning-block {
    margin-top: 10px;
    padding-left: 4px;
    border-left: 2px solid #e6a817;
  }
  button {
    width: 100%;
    padding: 7px;
    background: #e53935;
    color: white;
    border: none;
    border-radius: 3px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }
  button:hover { background: #c62828; }
  .hint {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    margin-top: -6px;
    margin-bottom: 10px;
  }
</style>
</head>
<body>
<div class="logo">
  <div class="logo-circle">FA!</div>
  <span class="logo-title">FAAAAAH</span>
</div>

<div class="section">
  <div class="section-title">Errors</div>
  <label for="minNewErrors">Trigger after this many new errors</label>
  <input type="number" id="minNewErrors" min="1" value="${minNewErrors}"/>
  <label for="soundFile">Custom error sound path</label>
  <input type="text" id="soundFile" placeholder="Leave empty to use bundled sound" value="${soundFile}"/>
  <div class="hint">Supports .mp3 / .wav</div>
</div>

<div class="section">
  <div class="section-title">Warnings</div>
  <div class="toggle-row">
    <input type="checkbox" id="warningSoundEnabled" ${warningSoundEnabled ? 'checked' : ''}/>
    <label for="warningSoundEnabled" style="margin:0">Enable warning sound</label>
  </div>
  <div class="warning-block" id="warningOptions" style="display:${warningSoundEnabled ? 'block' : 'none'}">
    <label for="minNewWarnings">Trigger after this many new warnings</label>
    <input type="number" id="minNewWarnings" min="1" value="${minNewWarnings}"/>
    <label for="warningSoundFile">Custom warning sound path</label>
    <input type="text" id="warningSoundFile" placeholder="Leave empty to use bundled sound" value="${warningSoundFile}"/>
    <div class="hint">Supports .mp3 / .wav</div>
  </div>
</div>

<button id="saveBtn">Save Settings</button>

<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();

  document.getElementById('warningSoundEnabled').addEventListener('change', function() {
    document.getElementById('warningOptions').style.display = this.checked ? 'block' : 'none';
  });

  document.getElementById('saveBtn').addEventListener('click', () => {
    vscode.postMessage({
      command: 'save',
      minNewErrors: parseInt(document.getElementById('minNewErrors').value, 10) || 1,
      warningSoundEnabled: document.getElementById('warningSoundEnabled').checked,
      minNewWarnings: parseInt(document.getElementById('minNewWarnings').value, 10) || 1,
      soundFile: document.getElementById('soundFile').value.trim(),
      warningSoundFile: document.getElementById('warningSoundFile').value.trim()
    });
  });
</script>
</body>
</html>`;
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const bundledSound = path.join(context.extensionPath, 'sounds', 'faaaaah.mp3');

  const provider = new FaaaaahViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(FaaaaahViewProvider.viewId, provider)
  );

  const listener = vscode.languages.onDidChangeDiagnostics(() => {
    const cfg = vscode.workspace.getConfiguration('faaaaah');
    const minNewErrors: number = cfg.get('minNewErrors', 1);
    const warningSoundEnabled: boolean = cfg.get('warningSoundEnabled', false);
    const minNewWarnings: number = cfg.get('minNewWarnings', 1);
    const soundFile: string = cfg.get('soundFile', '');
    const warningSoundFile: string = cfg.get('warningSoundFile', '');

    const { errors, warnings } = getCounts();

    const newErrors = errors - previousErrorCount;
    const newWarnings = warnings - previousWarningCount;
    previousErrorCount = errors;
    previousWarningCount = warnings;

    if (newErrors >= minNewErrors) {
      playSound(soundFile.trim() !== '' ? soundFile.trim() : bundledSound);
    }

    if (warningSoundEnabled && newWarnings >= minNewWarnings) {
      playSound(warningSoundFile.trim() !== '' ? warningSoundFile.trim() : bundledSound);
    }
  });

  context.subscriptions.push(listener);
}

export function deactivate(): void {}
