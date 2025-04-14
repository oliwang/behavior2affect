import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { globalState } from '../globalState';
import * as cp from "child_process";

export class Logger {
    private logFilePath: string | undefined;
    private logMouseFilePath: string | undefined;
    private logKeyboardFilePath: string | undefined;
    private logMouseProcess: cp.ChildProcess | undefined;
    private logKeyboardProcess: cp.ChildProcess | undefined;

    private disposables: vscode.Disposable[] = [];
    private static instance: Logger;
    private static terminalPrefix = "";

    private constructor() {


    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public static setTerminalPrefix(prefix: string): void {
        Logger.terminalPrefix = prefix;
    }

    public static getTerminalPrefix(): string {
        return Logger.terminalPrefix;
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

        this.logFilePath = path.join(logDir, `${timestamp}_log.txt`);
        this.logMouseFilePath = path.join(logDir, `${timestamp}_mouse_log.txt`);
        this.logKeyboardFilePath = path.join(logDir, `${timestamp}_keyboard_log.txt`);
        this.log('LOG_START');
        // console.log(__dirname);

        this.logKeyboardProcess = cp.exec(`/Users/olivia/Documents/Programming/03-TryNewStuff/mk_dynamics/.venv/bin/python ${path.join(__dirname, 'keyboard_dynamics.py')} ${this.logKeyboardFilePath}`);
        this.log('LOG_KEYBOARD_PROCESS_STARTED');
        this.logMouseProcess = cp.exec(`/Users/olivia/Documents/Programming/03-TryNewStuff/mk_dynamics/.venv/bin/python ${path.join(__dirname, 'mouse_dynamics.py')} ${this.logMouseFilePath}`);
        this.log('LOG_MOUSE_PROCESS_STARTED');
    }

    /**
     * Logs a data to the file if logging is enabled
     */
    public log(eventName: string, data?: Object): void {
        if (!globalState.getLogStatus() || !this.logFilePath) {
            return;
        }

        // Create a JSON object for the log entry
        const logObject = {
            timestamp: Date.now(),
            event: eventName,
        };

        if (data) {
            Object.assign(logObject, data);
        }

        // Convert to JSON string and add newline
        const logEntry = JSON.stringify(logObject) + '\n';

        fs.appendFileSync(this.logFilePath, logEntry);
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


    public stopLogging(): void {
        this.logKeyboardProcess?.kill();
        this.logMouseProcess?.kill();
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
