import * as vscode from 'vscode';
import { Class } from "./symbols";

interface SearchResult {
    class: Class;
    rating: number;
}

interface QuickPickItem extends vscode.QuickPickItem {
    class: Class;
}

export const search = async (classes: Class[]) => {
    classes.sort((a, b) => a.name.localeCompare(b.name));
    const quickPickItems = classes.map(item => ({
        label: item.name,
        description: item.description,
        detail: item.methods.map(method => `${method.name}: ${method.description ?? ''}`).join(', '),
        class: item
    } as QuickPickItem));
    const quickPick = vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Search for a class',
        matchOnDescription: true,
        matchOnDetail: true,
        canPickMany: false,
    });
    quickPick.then(selected => {
        if (selected) {
            const classUri = selected.class.uri;
            if (classUri) {
                vscode.workspace.openTextDocument(classUri).then(doc => {
                    vscode.window.showTextDocument(doc, { preview: false });
                });
            } else {
                vscode.window.showErrorMessage('Class URI not found.');
            }
        }
    });
};