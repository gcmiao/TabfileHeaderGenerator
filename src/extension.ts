'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as lineReader from 'line-reader';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "tabfile-header-generator" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);

    let contentDir = "src/Content"
    let gamedataDir = "src/Content/GameData/"
    let generateHeaderDisposable = vscode.commands.registerTextEditorCommand('extension.generateHeader', (textEditor, edit, args) => {
        let selectString = textEditor.document.getText(textEditor.selection)
        console.log(selectString)
        let tabfileClassPath : string = args.path
        let absPathPrefixIdx = tabfileClassPath.indexOf(contentDir)
        console.log(absPathPrefixIdx)
        let absPathPrefix = tabfileClassPath.substr(0, absPathPrefixIdx)
        let absTabfilePath = absPathPrefix.concat(gamedataDir).concat(selectString)
        console.log(absTabfilePath)
        let tabfileData = fs.readFileSync(absTabfilePath, "utf-8")
        console.log(textEditor)
        console.log(edit)
        console.log(args)
        vscode.window.showInformationMessage("Hello");
    });
    context.subscriptions.push(generateHeaderDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}