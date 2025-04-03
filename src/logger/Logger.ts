import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { globalState } from '../globalState';

export class Logger {
    private logFilePath: string | undefined;
    private disposables: vscode.Disposable[] = [];
    private static instance: Logger;

    private constructor() {
        // Register window focus change events
        this.disposables.push(
            vscode.window.onDidChangeWindowState(this.handleWindowStateChange.bind(this))
        );
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public initialize(context: vscode.ExtensionContext): void {
        // Register this logger instance for cleanup
        context.subscriptions.push(this);
    }

    /**
     * Creates a new log file when recording starts
     */
    public startNewLogFile(): void {
        if (!globalState.getLogStatus()) {
            return;
        }

        // Use Unix timestamp for file naming
        const timestamp = Date.now();
        const logDir = this.getLogDirectory();

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        this.logFilePath = path.join(logDir, `log_${timestamp}.txt`);
        this.log('LOG_START', 'Logging started');
    }

    /**
     * Logs a message to the file if logging is enabled
     */
    public log(eventType: string, message: string, details?: any): void {
        if (!globalState.getLogStatus() || !this.logFilePath) {
            return;
        }

        // Use Unix timestamp (milliseconds since epoch)
        const timestamp = Date.now();
        let logEntry = `[${timestamp}] [${eventType}] ${message}`;

        if (details) {
            logEntry += `\n${JSON.stringify(details, null, 2)}`;
        }

        logEntry += '\n';

        fs.appendFileSync(this.logFilePath, logEntry);
    }

    /**
     * Handles window state changes (focus/blur)
     */
    private handleWindowStateChange(e: vscode.WindowState): void {
        if (e.focused) {
            this.log('WINDOW_FOCUS', 'VS Code window gained focus');
        } else {
            this.log('WINDOW_BLUR', 'VS Code window lost focus');
        }
    }

    /**
     * Gets the directory where logs should be stored
     */
    private getLogDirectory(): string {
        // Get user's Downloads folder
        const homeDir = os.homedir();
        const downloadsDir = path.join(homeDir, 'Downloads');

        // Create a subdirectory for our logs
        const logDir = path.join(downloadsDir, 'behavior2affect-logs');

        return logDir;
    }

    /**
     * Opens the current log file in the editor
     */
    public async openCurrentLogFile(): Promise<void> {
        if (!this.logFilePath) {
            vscode.window.showInformationMessage('No active log file. Start logging first.');
            return;
        }

        try {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(this.logFilePath));
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open log file: ${error}`);
        }
    }

    /**
     * Opens the logs directory in file explorer
     */
    public async openLogsDirectory(): Promise<void> {
        const logDir = this.getLogDirectory();

        // Ensure the directory exists
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Open the directory using the operating system's file explorer
        const uri = vscode.Uri.file(logDir);
        vscode.env.openExternal(uri);
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
