

import * as vscode from 'vscode';
import { Class, Method, Parameter, symbolRegex } from './symbols';

interface ParsedComment {
    description: string | null;
    parameters: Parameter[];
}

interface SymbolDescriptor {
    name: string;
    type: string;
}

interface TagDescriptor {
    name: string;
    type: string;
    description: string;
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

const createSymbolDescriptor = (text: string): SymbolDescriptor | null => {
    for (const type of Object.keys(symbolRegex)) {
        const regex = symbolRegex[type];
        const match = text.match(regex);
        if (match) {
            return {
                name: match[1],
                type: type,
            };
        }
    }

    return null;
};

const findClasses = (uri: vscode.Uri, text: string): Array<Class> => {
	const commentRegex = /\/\*\*((?:\r?\n|.)*?)\*\/(?:\r?\n|\s)(.*)(?:\r?\n|\s)+[{=]/g;
	const comments = text.matchAll(commentRegex);

	const classes: Class[] = [];
    let currentClass = null;
	for (const comment of comments) {
		const commentText = comment[1];
		const symbolDefinition = comment[2].trim();

        const symbolDescriptor = createSymbolDescriptor(symbolDefinition);
        if (symbolDescriptor?.type === 'class') {
            const parsedComment = parseComment(symbolDescriptor.type, commentText);

            const classObj = new Class(
                symbolDescriptor.name,
                parsedComment.description,
                [],
                uri
            );

            currentClass = classObj;
            classes.push(classObj);
        } else if (currentClass && symbolDescriptor?.type === 'method') {
            const parsedComment = parseComment(symbolDescriptor.type, commentText);
            const method = new Method(
                symbolDescriptor.name,
                parsedComment.description,
                parsedComment.parameters,
            );

            currentClass.addMethod(method);
        }
	}

	return classes;
};

const parseComment = (symbolType: 'class' | 'method', comment: string): ParsedComment => {
    let index = 0;
    let waitingForNewLine = false;
    let waitingForWord = false;
    let builtString = '';
    const parameters: Parameter[] = [];

    while (index < comment.length) {
        const token = comment[index];

        if (token === '*' && !waitingForWord && !waitingForNewLine) {
            // we have hit an asterisk, and are not waiting for a new line
            // this means we are at the start of a new line of the comment
            waitingForWord = true;
        } else if ((token === '\n' || token === '\r') && waitingForNewLine && !waitingForWord) {
            // we have hit the end of a line
            // if we've just got the class string then we need to clear the built string
            if (symbolType === 'class' && builtString.match(/^Class\s\w+$/)) {
                builtString = '';
            } else if (!builtString.match(/\.$/)) {
                builtString += '. ';
            } else {
                builtString += ' ';
            }

            // now we just need to wait until we hit an asterisk
            waitingForNewLine = false;
            waitingForWord = false;
        } else if (waitingForWord && !waitingForNewLine && token === '@') {
            // we parse the symbol
            // and then we need to wait for an asterisk
            const tag = parseTag(index, comment);
            if (tag?.type === 'param') {
                parameters.push(new Parameter(
                    tag.name,
                    null,
                    tag.description.length ? tag.description : null
                ));
            }
            waitingForWord = false;
            waitingForNewLine = false;
        } else if (waitingForWord && !waitingForNewLine && token.match(/\w/)) {
            // we are waiting for the first word of the line
            // and we have hit it
            // record the character and wait for a new line
            builtString += token;
            waitingForWord = false;
            waitingForNewLine = true;
        } else if (waitingForNewLine && !waitingForWord) {
            // we are waiting for a new line
            // but have no hit it yet
            // record the character and keep waiting for new line
            builtString += token;
        }

        index++;
    };

    return {
        description: builtString.length ? builtString : null,
        parameters,
    };
};

const parseTag = (startingIndex: number, comment: string): TagDescriptor => {
    let index = startingIndex;
    let readingTagType = false;
    let readingTagName = false;
    let readingTagDescription = false;
    let tagType = '';
    let tagName = '';
    let tagDescription = '';
    
    while (index < comment.length) {
        const token = comment[index];

        if (token === '@') {
            // we are at the start of a new symbol
            // we are waiting for the symbol type
            readingTagType = true;
        } else if (readingTagType) {
            if (token.match(/\s/)) {
                // we are at the end of the symbol type
                readingTagType = false;
                readingTagName = true;
            } else {
                // we are still reading the symbol type
                tagType += token;
            }
        } else if (readingTagName) {
            if (token.match(/\s/) && tagName.includes('$')) {
                // we are at the end of the symbol name
                readingTagName = false;
                readingTagDescription = true;
            } else {
                // we are still reading the symbol name
                tagName += token;
            }
        } else if (readingTagDescription) {
            if (token === '\n' || token === '\r') {
                // we are at the end of the symbol description
                readingTagDescription = false;
                break;
            } else {
                // we are still reading the symbol description
                tagDescription += token;
            }
        }

        index++;
    }

    return {
        name: tagName,
        type: tagType,
        description: tagDescription.trim(),
    };
};