import * as vscode from "vscode";
import { globalState } from "../globalState";
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
        this.isRunning = !this.isRunning;
        globalState.setLogStatus(this.isRunning);
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
