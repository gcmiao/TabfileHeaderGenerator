'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';

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

    let contentDir = "src\\Content"
    let gamedataDir = "src/Content/GameData/"
    let generateHeaderDisposable = vscode.commands.registerTextEditorCommand('extension.generateHeader', (textEditor, edit, args) => {
        let document = textEditor.document
        // Get selected string as tabfile path
        let selectString = document.getText(textEditor.selection)
        selectString = selectString.trim()
        if (selectString.startsWith("\"")) {
            selectString = selectString.substring(1, selectString.length)
        }
        if (selectString.endsWith("\"")) {
            selectString = selectString.substring(0, selectString.length - 1)
        }
        // Combine a tabfile from tabfile class file path
        let tabfileClassPath : string = args.fsPath
        let absPathPrefixIdx = tabfileClassPath.indexOf(contentDir)
        let absPathPrefix = tabfileClassPath.substr(0, absPathPrefixIdx)
        let absTabfilePath = absPathPrefix + gamedataDir + selectString
        // Find insert position for generated codes
        let totalText = GetTotalTextInDocument(document)
        let parseLineIdx = totalText.search(/[\n\r]function.*:OnParseLine\(Parser\)/)
        if (parseLineIdx != -1) {
            let insertLine = document.positionAt(parseLineIdx).line + 2
            ParseTabfileColumnNamesAndTypes(absTabfilePath, edit, insertLine)
        }
        else {
            vscode.window.showErrorMessage("Cannot find a suitable position to insert the generated codes.")
        }
    });
    context.subscriptions.push(generateHeaderDisposable);
}

function GetTotalTextInDocument(document : vscode.TextDocument) {
    let lastLineLen = document.lineAt(document.lineCount - 1).text.length
    let totalRange = new vscode.Range(0, 0, document.lineCount, lastLineLen)
    totalRange = document.validateRange(totalRange)
    let totalText = document.getText(totalRange)
    return totalText
}

function ParseTabfileColumnNamesAndTypes(absTabfilePath : string, edit : vscode.TextEditorEdit, insertLine : number) {
    if (fs.existsSync(absTabfilePath)) {
        // Read tabfile and split to lines
        let tabfile = fs.readFileSync(absTabfilePath, "utf-8")
        let tabfileLines = tabfile.split(/\r\n|\n/)
        let columnTypes : string[] = null
        let columnNames : string[] = null
        let lineIdx = 0
        // Parse header names and type infos
        for (; lineIdx < tabfileLines.length; lineIdx++) {
            let line = tabfileLines[lineIdx];
            if (line.startsWith("#type")) {
                let tmpLine = line.replace(/ /g, "").trim()
                tmpLine = tmpLine.replace(/#type=/, "")
                columnTypes = tmpLine.split("\t")
            }
            else if (columnNames == null && !line.startsWith("#")) {
                columnNames = line.split("\t")
            }
            if (columnNames != null && columnTypes != null) {
                ParseTabfileCompleted(edit, insertLine, columnNames, columnTypes)
                break
            }
        }
        if (lineIdx == tabfileLines.length) {
            ParseTabfileCompleted(edit, insertLine, columnNames, columnTypes)
        }
    }
    else {
        vscode.window.showErrorMessage("File not exist:" + absTabfilePath)
    }
}

function ParseTabfileCompleted(edit : vscode.TextEditorEdit, insertLine : number,  columnNames : string[], columnTypes : string[]) {
    let generateCode = GenerateLineParseCode(columnNames, columnTypes)
    edit.insert(new vscode.Position(insertLine, 0), generateCode)
}

function GenerateLineParseCode(columnNames : string[], columnTypes : string[]) {
    if (columnNames == null) {
        vscode.window.showErrorMessage("Cannot find column names.")
        return
    }
    else if(columnTypes == null) {
        vscode.window.showWarningMessage("Cannot find column types.")
    }
    else if (columnNames.length != columnTypes.length) {
        vscode.window.showWarningMessage("Column name count isn't equal to column type count. " + columnNames.length + " vs " + columnTypes.length)
    }

    let generateCode : string[] = []
    let generateLineIdx = 0
    generateCode[generateLineIdx++] = "local NewTemplate = {}"
    for (let i = 0; i < columnNames.length; i++) {
        let columnName = columnNames[i]
        let columnType = (columnTypes != null && i < columnTypes.length) ? columnTypes[i] : ""
        if (columnType.startsWith('_')) {
            continue
        }
        // add type symbol
        let lineParser = "NewTemplate." + GetColumnTypePrefix(columnType)
        // convert low_case_with_underline to PascalCase
        let upperColumnName = columnName.replace(/\_[a-z]/g, function(substr, args) {
            return substr[1].toLocaleUpperCase()
        }).replace(/^[a-z]/, function(substr, args) {
            return substr.toLocaleUpperCase()
        })
        lineParser = lineParser + upperColumnName + " = Parser:Get(\"" + columnName + "\", "
        lineParser = lineParser + GetDefaultValueByColumnType(columnType) + ", "
        lineParser = lineParser + GetParserType(columnType) + ", true)"
        generateCode[generateLineIdx++] = lineParser
    }
    AddIntentSpace(generateCode, 4)
    let nextStartIdx = AlignWithCharacter(generateCode, 1, "=", 0, true)
    nextStartIdx = AlignWithCharacter(generateCode, 1, ",", nextStartIdx)
    nextStartIdx = AlignWithCharacter(generateCode, 1, ",", nextStartIdx, true)
    nextStartIdx = AlignWithCharacter(generateCode, 1, ",", nextStartIdx)
    return TextLinesToEntireText(generateCode)
}

let IntentSpaceMap : string[] = []
IntentSpaceMap[0] = " "

function GetIntentSpaceString(space : number) {
    let bit = 0
    let retStr = ""
    while (space > 0) {
        if (IntentSpaceMap[bit] == null || IntentSpaceMap[bit].length == 0) {
            IntentSpaceMap[bit] = IntentSpaceMap[bit - 1] + IntentSpaceMap[bit - 1]
        }
        if (space % 2) {
            retStr += IntentSpaceMap[bit]
            --space
        }
        ++bit
        space /= 2
    }
    return retStr
}

function AlignWithCharacter(textLines : string[], startLine : number, character : string, startIdx : number, rightAlign : boolean = false) {
    let rightMostIdx = 0
    for (let i = startLine; i < textLines.length; ++i) {
        let characterIdx = textLines[i].indexOf(character, startIdx)
        rightMostIdx = characterIdx > rightMostIdx ? characterIdx : rightMostIdx
    }
    for (let i = startLine; i < textLines.length; ++i) {
        let line = textLines[i]
        let characterIdx = line.indexOf(character, startIdx)
        let intentStr = GetIntentSpaceString(rightMostIdx - characterIdx)
        if (rightAlign) {
            characterIdx = line.lastIndexOf(" ", characterIdx)
        }
        else {
            characterIdx += character.length;
        }
        let front = line.substring(0, characterIdx)
        let rear = line.substring(characterIdx, line.length)
        textLines[i] = front + intentStr + rear
    }
    return rightMostIdx + 1
}

function TextLinesToEntireText(textLines : string[]) {
    let retText = ""
    for (let i = 0; i < textLines.length; ++i) {
        retText += textLines[i] + "\r\n"
    }
    return retText
}

function AddIntentSpace(textLines : string[], space : number) {
    let intentStr = GetIntentSpaceString(space)
    for (let i = 0; i < textLines.length; ++i) {
        let line = textLines[i]
        textLines[i] = intentStr + line
    }
}

function GetParserType(columnType : string) {
    switch (columnType) {
        case "int":
            return "Parser.TypeInt"
        case "float":
            return "Parser.TypeFloat"
        case "string":
            return "Parser.TypeString"
        case "bool":
            return "Parser.TypeBool"
        case "l10n":
            return "Parser.TypeL10N"
        case "int_array":
            return "Parser.TypeArrayInt"
        case "string_array":
            return "Parser.TypeArrayString"
        case "float_array":
            return "Parser.TypeArrayFloat"
        case "bool_array":
            return "Parser.TypeArrayBool"
        case "l10n_array":
            return "Parser.TypeArrayL10N"
    }
    return "\"\""
}

function GetDefaultValueByColumnType(columnType : string) {
    switch (columnType) {
        case "int":
            return "-1"
        case "float":
            return "0.0"
        case "string":
            return "\"\""
        case "bool":
            return "false"
        case "l10n":
            return "L10N.NullString"
        case "int_array":
            return "nil"
        case "string_array":
            return "nil"
        case "float_array":
            return "nil"
        case "bool_array":
            return "nil"
        case "l10n_array":
            return "nil"
    }
    return "\"\""
}

function GetColumnTypePrefix(columnType : string) {
    switch (columnType) {
        case "int":
            return "n"
        case "float":
            return "n"
        case "string":
            return "sz"
        case "bool":
            return "b"
        case "l10n":
            return "l10n"
        case "int_array":
            return "tb"
        case "string_array":
            return "tb"
        case "float_array":
            return "tb"
        case "bool_array":
            return "tb"
        case "l10n_array":
            return "tb"
    }
    return "var"
}

// this method is called when your extension is deactivated
export function deactivate() {
}
