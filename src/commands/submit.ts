// Copyright (c) jdneo. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { leetCodeTreeDataProvider } from "../explorer/LeetCodeTreeDataProvider";
import { leetCodeExecutor } from "../leetCodeExecutor";
import { leetCodeManager } from "../leetCodeManager";
import { DialogType, promptForOpenOutputChannel, promptForSignIn } from "../utils/uiUtils";
import { getActiveFilePath } from "../utils/workspaceUtils";
import { leetCodeSubmissionProvider } from "../webview/leetCodeSubmissionProvider";
import { Logger } from "../logger/Logger";

export async function submitSolution(uri?: vscode.Uri): Promise<void> {
    if (!leetCodeManager.getUser()) {
        promptForSignIn();
        return;
    }

    const filePath: string | undefined = await getActiveFilePath(uri);
    if (!filePath) {
        return;
    }

    // Get code content from the active editor
    let codeContent = "";
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.fsPath === filePath) {
        codeContent = activeEditor.document.getText();
    }

    // Log the code submission event with code content
    Logger.getInstance().log('CODE_SUBMIT', 'Submitting solution to LeetCode', {
        filePath,
        code: codeContent
    });

    try {
        const result: string = await leetCodeExecutor.submitSolution(filePath);
        // Log the submission result
        Logger.getInstance().log('SUBMIT_RESULT', 'Received submission result from LeetCode', { result });
        leetCodeSubmissionProvider.show(result);
    } catch (error) {
        // Log submission error
        Logger.getInstance().log('SUBMIT_ERROR', 'Failed to submit solution', { error: error.message });
        await promptForOpenOutputChannel("Failed to submit the solution. Please open the output channel for details.", DialogType.error);
        return;
    }

    leetCodeTreeDataProvider.refresh();
}
