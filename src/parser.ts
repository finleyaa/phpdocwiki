

import * as vscode from 'vscode';
import { Class } from './symbols';

interface ParsedComment {
    description: string | null;
}

/**
 * Indexes PHP files in the given folder and extracts class information.
 * @param folder The folder to search for PHP files.
 * @returns A promise that resolves to an array of Class objects.
 */
export const index = (folder: string): Promise<Class[]> => {
    return new Promise<Class[]>((resolve, reject) => {
        findPhpFiles(folder)
            .then(files => {
                const classes: Class[] = [];
                const promises = files.map(file => 
                    vscode.workspace.openTextDocument(vscode.Uri.file(file))
                        .then(document => {
                            const text = document.getText();
                            const result = findClasses(document.uri, text);
                            classes.push(...result);
                        })
                );
                Promise.all(promises).then(() => {
                    resolve(classes);
                });
            })
            .catch(err => {
                console.error('Error finding PHP files:', err);
                reject(err);
            });
    });
};

const findPhpFiles = (folder: string): Promise<string[]> => {
	return new Promise<string[]>((resolve, reject) => {
        const phpFiles: string[] = [];

        vscode.workspace.findFiles(
            new vscode.RelativePattern(folder, '**/*.php'),
            new vscode.RelativePattern(folder, '**/vendor/**')
        ).then(uris => {
            uris.forEach((uri) => {
                phpFiles.push(uri.fsPath);
            });
            resolve(phpFiles);
        });
	});
};

const findClasses = (uri: vscode.Uri, text: string): Array<Class> => {
	const commentRegex = /\/\*\*((?:\r?\n|.)*?)\*\/(?:\r?\n|\s)(.*)(?:\r?\n|\s)+[{=]/g;
	const comments = text.matchAll(commentRegex);
	const classes: Class[] = [];
	for (const comment of comments) {
		const commentText = comment[1];
		const symbolDefinition = comment[2].trim();
        const className = symbolDefinition.match(/class\s+(\w+)/);
        if (className) {
            const parsedComment = parseComment(commentText);
            const classObj = new Class(
                className[1],
                parsedComment.description,
                [],
                uri
            );
            classes.push(classObj);
        }
	}

	return classes;
};

const parseComment = (comment: string): ParsedComment => {
    let index = 0;
    let builtString = '';

    while (index < comment.length) {
        const token = comment[index];

        if (token === '\n' || token === '\r') {
            if (builtString.match(/^Class\s\w+$/)) {
                builtString = '';
            }
        }

        builtString += token;
        index++;

        if (builtString.match(/^\s+\*+\s+$/)) {
            builtString = '';
        }
    };

    builtString = builtString.replaceAll(/\.*(?:\r\n|\n|\r)+(?:\s*\*+\s+)*/gm, '. ').trim();

    return {
        description: builtString.length ? builtString : null,
    };
};