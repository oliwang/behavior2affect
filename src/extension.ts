// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { codeLensController } from "./codelens/CodeLensController";
import * as cache from "./commands/cache";
import { switchDefaultLanguage } from "./commands/language";
import * as plugin from "./commands/plugin";
import * as session from "./commands/session";
import * as show from "./commands/show";
import * as star from "./commands/star";
import * as submit from "./commands/submit";
import * as test from "./commands/test";
import { explorerNodeManager } from "./explorer/explorerNodeManager";
import { LeetCodeNode } from "./explorer/LeetCodeNode";
import { leetCodeTreeDataProvider } from "./explorer/LeetCodeTreeDataProvider";
import { leetCodeTreeItemDecorationProvider } from "./explorer/LeetCodeTreeItemDecorationProvider";
import { leetCodeChannel } from "./leetCodeChannel";
import { leetCodeExecutor } from "./leetCodeExecutor";
import { leetCodeManager } from "./leetCodeManager";
import { leetCodeStatusBarController } from "./statusbar/leetCodeStatusBarController";
import { DialogType, promptForOpenOutputChannel } from "./utils/uiUtils";
import { leetCodePreviewProvider } from "./webview/leetCodePreviewProvider";
import { leetCodeSolutionProvider } from "./webview/leetCodeSolutionProvider";
import { leetCodeSubmissionProvider } from "./webview/leetCodeSubmissionProvider";
import { markdownEngine } from "./webview/markdownEngine";
import TrackData from "./utils/trackingUtils";
import { globalState } from "./globalState";
import { StartStopStatusBarItem } from "./statusbar/StartStopStatusBarItem";
import { Logger } from "./logger/Logger";
import * as cp from "child_process";


class HiddenTerminal implements vscode.Pseudoterminal {

    private writeEmitter = new vscode.EventEmitter<string>();
    private closeEmitter = new vscode.EventEmitter<void>();
    private name: string;

    constructor() {
        this.name = `hidden-terminal-${Date.now()}`;
    }

    onDidWrite = this.writeEmitter.event;
    onDidClose = this.closeEmitter.event;

    open() : void {
        this.writeEmitter.fire("");
    }

    close() : void {
        this.closeEmitter.fire();
    }

    getName() : string {
        return this.name;
    }

    execute(command: string) : any {
        if (!command) return;

        const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        this.writeEmitter.fire(`${executionId}\n`);

        cp.exec(command, (error, stdout, stderr) => {
            if (error) {
                Logger.getInstance().log("TERMINAL_SHELL_EXECUTION_ERROR", {
                    command,
                    executionId,
                    error: error.message,
                    stdout,
                    stderr
                });
            } else {
                Logger.getInstance().log("TERMINAL_SHELL_EXECUTION_SUCCESS", {
                    command,
                    executionId,
                    stdout,
                    stderr
                });
            }

        });

    }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    try {
        if (!(await leetCodeExecutor.meetRequirements(context))) {
            throw new Error("The environment doesn't meet requirements.");
        }

        leetCodeManager.on("statusChanged", () => {
            leetCodeStatusBarController.updateStatusBar(leetCodeManager.getStatus(), leetCodeManager.getUser());
            leetCodeTreeDataProvider.refresh();
        });

        leetCodeTreeDataProvider.initialize(context);
        globalState.initialize(context);
        // Initialize the logger
        Logger.getInstance().initialize(context);

        // problems "2413", "1800", "54", "885"
        // status: hide, show
        globalState.setProblemSetStatus([
            {problemId: "2235", status: "show"},
            {problemId: "2413", status: "hide"},
            {problemId: "1800", status: "hide"},
            {problemId: "54", status: "hide"},
            {problemId: "885", status: "hide"}
        ]);
        globalState.setCurrentFileNumber("2235");

        const startStopStatusBar = new StartStopStatusBarItem();

        // If logging was enabled in previous session, start a new log file
        if (globalState.getLogStatus()) {
            Logger.getInstance().startNewLogFile();
        }

        context.subscriptions.push(
            leetCodeStatusBarController,
            leetCodeChannel,
            leetCodePreviewProvider,
            leetCodeSubmissionProvider,
            leetCodeSolutionProvider,
            leetCodeExecutor,
            markdownEngine,
            codeLensController,
            explorerNodeManager,
            vscode.window.registerFileDecorationProvider(leetCodeTreeItemDecorationProvider),
            vscode.window.createTreeView("leetCodeExplorer", { treeDataProvider: leetCodeTreeDataProvider, showCollapseAll: true }),
            vscode.commands.registerCommand("leetcode.deleteCache", () => cache.deleteCache()),
            vscode.commands.registerCommand("leetcode.toggleLeetCodeCn", () => plugin.switchEndpoint()),
            vscode.commands.registerCommand("leetcode.signin", () => leetCodeManager.signIn()),
            vscode.commands.registerCommand("leetcode.signout", () => leetCodeManager.signOut()),
            vscode.commands.registerCommand("leetcode.manageSessions", () => session.manageSessions()),
            vscode.commands.registerCommand("leetcode.previewProblem", (node: LeetCodeNode) => {
                TrackData.report({
                    event_key: `vscode_open_problem`,
                    type: "click",
                    extra: JSON.stringify({
                        problem_id: node.id,
                        problem_name: node.name,
                    }),
                });
                show.previewProblem(node);
            }),
            vscode.commands.registerCommand("leetcode.showProblem", (node: LeetCodeNode) => show.showProblem(node)),
            vscode.commands.registerCommand("leetcode.pickOne", () => show.pickOne()),
            vscode.commands.registerCommand("leetcode.searchProblem", () => show.searchProblem()),
            vscode.commands.registerCommand("leetcode.showSolution", (input: LeetCodeNode | vscode.Uri) => show.showSolution(input)),
            vscode.commands.registerCommand("leetcode.refreshExplorer", () => leetCodeTreeDataProvider.refresh()),
            vscode.commands.registerCommand("leetcode.testSolution", (uri?: vscode.Uri) => {
                TrackData.report({
                    event_key: `vscode_runCode`,
                    type: "click",
                    extra: JSON.stringify({
                        path: uri?.path,
                    }),
                });
                return test.testSolution(uri);
            }),
            vscode.commands.registerCommand("leetcode.submitSolution", (uri?: vscode.Uri) => {
                TrackData.report({
                    event_key: `vscode_submit`,
                    type: "click",
                    extra: JSON.stringify({
                        path: uri?.path,
                    }),
                });
                return submit.submitSolution(uri);
            }),
            vscode.commands.registerCommand("leetcode.switchDefaultLanguage", () => switchDefaultLanguage()),
            vscode.commands.registerCommand("leetcode.addFavorite", (node: LeetCodeNode) => star.addFavorite(node)),
            vscode.commands.registerCommand("leetcode.removeFavorite", (node: LeetCodeNode) => star.removeFavorite(node)),
            vscode.commands.registerCommand("leetcode.problems.sort", () => plugin.switchSortingStrategy()),
            startStopStatusBar,
            vscode.commands.registerCommand("behavior2affect.toggleStartStop", () => {
                startStopStatusBar.toggle();
            }),
            vscode.commands.registerCommand("behavior2affect.getCurrentFilePath", () => {
                // get the active text editor file path
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const filePath = editor.document.uri.fsPath;
                    // Logger.getInstance().log("CURRENT_FILE_PATH", filePath);
                    // copy the file path to the clipboard
                    vscode.env.clipboard.writeText(filePath);
                }
            })
        );

        // related to terminal

        let pseudoterminal = new HiddenTerminal();
        pseudoterminal.open();

        context.subscriptions.push(
            vscode.window.onDidStartTerminalShellExecution(e => {
                Logger.getInstance().log("TERMINAL_SHELL_EXECUTION_START", e);
                pseudoterminal.execute(e.execution.commandLine.value);

            }),
            vscode.window.onDidEndTerminalShellExecution(e => {
                Logger.getInstance().log("TERMINAL_SHELL_EXECUTION_END", e);
            }),
            vscode.window.onDidChangeTerminalShellIntegration(e => {
                Logger.getInstance().log("TERMINAL_SHELL_INTEGRATION_CHANGE", e);
            }),
            vscode.window.onDidChangeTerminalState(e => {
                Logger.getInstance().log("TERMINAL_STATE_CHANGE", e);

            }),
            vscode.window.onDidOpenTerminal(e => {
                Logger.getInstance().log("TERMINAL_OPEN", e);

            }),
            vscode.window.onDidCloseTerminal(e => {
                Logger.getInstance().log("TERMINAL_CLOSE", e);
            })
        );

        // related to window
        context.subscriptions.push(
            vscode.window.onDidChangeWindowState(e => {
                if (e.focused) {
                    Logger.getInstance().log('WINDOW_FOCUS');
                } else {
                    Logger.getInstance().log('WINDOW_BLUR');
                }
            })
        );

        // related to editor

        context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(e => {
                Logger.getInstance().log("TEXT_EDITOR_SELECTION_CHANGE", e);
            })
        );

        await leetCodeExecutor.switchEndpoint(plugin.getLeetCodeEndpoint());
        await leetCodeManager.getLoginStatus();
        vscode.window.registerUriHandler({ handleUri: leetCodeManager.handleUriSignIn });
    } catch (error) {
        leetCodeChannel.appendLine(error.toString());
        promptForOpenOutputChannel("Extension initialization failed. Please open output channel for details.", DialogType.error);
    }
}

export function deactivate(): void {
    // Do nothing.
}
