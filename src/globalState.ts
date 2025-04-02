// Copyright (c) leo.zhao. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";

const CookieKey = "leetcode-cookie";
const UserStatusKey = "leetcode-user-status";
const ProblemSetStatusKey = "leetcode-problem-set-status";
const LogStatusKey = "leetcode-log-status";

export type UserDataType = {
    isSignedIn: boolean;
    isPremium: boolean;
    username: string;
    avatar: string;
    isVerified?: boolean;
};

export type ProblemStatusDataType = {
    problemId: string;
    status: string;
};

class GlobalState {
    private context: vscode.ExtensionContext;
    private _state: vscode.Memento;
    private _cookie: string;
    private _userStatus: UserDataType;
    private _problemSetStatus: ProblemStatusDataType[];
    private _logStatus: boolean;
    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        this._state = this.context.globalState;
    }

    public setCookie(cookie: string): any {
        this._cookie = cookie;
        return this._state.update(CookieKey, this._cookie);
    }
    public getCookie(): string | undefined {
        return this._cookie ?? this._state.get(CookieKey);
    }

    public setUserStatus(userStatus: UserDataType): any {
        this._userStatus = userStatus;
        return this._state.update(UserStatusKey, this._userStatus);
    }

    public getUserStatus(): UserDataType | undefined {
        return this._userStatus ?? this._state.get(UserStatusKey);
    }

    public removeCookie(): void {
        this._state.update(CookieKey, undefined);
    }

    public removeAll(): void {
        this._state.update(CookieKey, undefined);
        this._state.update(UserStatusKey, undefined);
        this._state.update(ProblemSetStatusKey, undefined);
    }

    public setProblemSetStatus(problemSetStatus: ProblemStatusDataType[]): any {
        this._problemSetStatus = problemSetStatus;
        return this._state.update(ProblemSetStatusKey, this._problemSetStatus);
    }

    public getProblemSetStatus(): ProblemStatusDataType[] | undefined {
        return this._problemSetStatus ?? this._state.get(ProblemSetStatusKey);
    }

    public setLogStatus(logStatus: boolean): any {
        this._logStatus = logStatus;
        return this._state.update(LogStatusKey, this._logStatus);
    }

    public getLogStatus(): boolean | undefined {
        return this._logStatus ?? this._state.get(LogStatusKey);
    }
}

export const globalState: GlobalState = new GlobalState();
