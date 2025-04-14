import * as vscode from "vscode";
import { globalState } from "../globalState";
import { Logger } from "../logger/Logger";

export class StartStopStatusBarItem implements vscode.Disposable {
    private readonly statusBarItem: vscode.StatusBarItem;
    private isRunning: boolean = false;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = "behavior2affect.toggleStartStop";
        this.isRunning = globalState.getLogStatus() ?? false;
        this.updateStatusBar();
    }

    public toggle(): void {
        // Store previous state to determine if we're stopping
        const wasRunning = this.isRunning;

        // Toggle the state
        this.isRunning = !this.isRunning;

        if (wasRunning) {
            // Log a stop event BEFORE changing global state
            Logger.getInstance().log('LOG_STOP');
            Logger.getInstance().stopLogging();
        }

        // Update global state after logging (if stopping)
        globalState.setLogStatus(this.isRunning);

        if (this.isRunning) {
            // Start a new log file when logging is turned on
            Logger.getInstance().startNewLogFile();
        }

        this.updateStatusBar();
    }

    private updateStatusBar(): void {
        if (this.isRunning) {
            this.statusBarItem.text = "$(stop) Stop";
            this.statusBarItem.tooltip = "Logging is running. Click to stop logging";
        } else {
            this.statusBarItem.text = "$(play) Start";
            this.statusBarItem.tooltip = "Click to start logging";
        }
        this.statusBarItem.show();
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}
