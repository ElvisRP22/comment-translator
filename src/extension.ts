import * as vscode from 'vscode';
import { TranslationService, TranslationOptions } from './translator';
import { TranslationHistoryManager } from './history';

// Variables globales para toda la extensión
let translationService: TranslationService;
let historyManager: TranslationHistoryManager;
let statusBarItem: vscode.StatusBarItem;
let translatedCount = 0;

/**
 * Esta función se ejecuta cuando la extensión se activa
 * VSCode llama a esta función automáticamente
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Comment Translator extension is now active!');

    translationService = new TranslationService();
    historyManager = new TranslationHistoryManager();

    // Crear Status Bar Item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = `$(globe) Comment Translator`;
    statusBarItem.tooltip = 'Click to view statistics and clear cache';
    statusBarItem.command = 'comment-translator.showStats';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Comando: Traducir selección
    const translateSelectionCommand = vscode.commands.registerCommand(
        'comment-translator.translateSelection',
        async () => {
            await translateSelection();
        }
    );

    // Comando: Traducir todos los comentarios
    const translateAllCommand = vscode.commands.registerCommand(
        'comment-translator.translateAllComments',
        async () => {
            await translateAllComments();
        }
    );

    // Comando: Deshacer última traducción
    const undoLastCommand = vscode.commands.registerCommand(
        'comment-translator.undoLastTranslation',
        async () => {
            await undoLastTranslation();
        }
    );

    // Comando: Limpiar caché
    const clearCacheCommand = vscode.commands.registerCommand(
        'comment-translator.clearCache',
        async () => {
            translationService.clearCache();
            vscode.window.showInformationMessage('Translation cache cleared');
            updateStatusBar();
        }
    );

    // Comando: Mostrar estadísticas
    const showStatsCommand = vscode.commands.registerCommand(
        'comment-translator.showStats',
        async () => {
            const cacheSize = translationService.getCacheSize();
            const historySize = historyManager.getSize();

            const selection = await vscode.window.showInformationMessage(
                `📊 Comment Translator Stats:\n` +
                `• Translations: ${translatedCount}\n` +
                `• Cache size: ${cacheSize} items\n` +
                `• History: ${historySize} entries`,
                'Clear Cache',
                'View History',
                'Close'
            );

            if (selection === 'Clear Cache') {
                vscode.commands.executeCommand('comment-translator.clearCache');
            } else if (selection === 'View History') {
                showHistoryQuickPick();
            }
        }
    );

    // Hover Provider
    const hoverProvider = vscode.languages.registerHoverProvider(
        { scheme: 'file', pattern: '**/*' },
        {
            async provideHover(document, position, token) {
                return provideCommentHover(document, position);
            }
        }
    );

    // Registrar todas las suscripciones
    context.subscriptions.push(translateSelectionCommand);
    context.subscriptions.push(translateAllCommand);
    context.subscriptions.push(undoLastCommand);
    context.subscriptions.push(clearCacheCommand);
    context.subscriptions.push(showStatsCommand);
    context.subscriptions.push(hoverProvider);

    // Actualizar status bar inicial
    updateStatusBar();
}

/**
 * Esta función se ejecuta cuando la extensión se desactiva
 */
export function deactivate() {
    console.log('Comment Translator extension is now deactivated');
}

/**
 * Actualiza el Status Bar con estadísticas
 */
function updateStatusBar(): void {
    const cacheSize = translationService.getCacheSize();
    statusBarItem.text = `$(globe) Translated: ${translatedCount} | Cache: ${cacheSize}`;
}

/**
 * Muestra el historial en un QuickPick
 */
async function showHistoryQuickPick(): Promise<void> {
    const history = historyManager.getAll();

    if (history.length === 0) {
        vscode.window.showInformationMessage('No translation history available');
        return;
    }

    const items = history.reverse().map((entry, index) => ({
        label: `Line ${entry.lineNumber + 1}`,
        description: `${entry.originalText.substring(0, 50)}...`,
        detail: `→ ${entry.translatedText.substring(0, 50)}...`,
        entry
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Translation history (newest first)'
    });

    if (selected) {
        vscode.window.showInformationMessage(
            `Original: ${selected.entry.originalText}\n` +
            `Translated: ${selected.entry.translatedText}`
        );
    }
}

/**
 * Obtiene la configuración de la extensión
 */
function getTranslationConfig(): {
    sourceLang: string;
    targetLang: string;
    provider: 'google' | 'libretranslate';
    libreTranslateUrl: string;
} {
    const config = vscode.workspace.getConfiguration('commentTranslator');

    return {
        sourceLang: config.get('sourceLanguage', 'auto'),
        targetLang: config.get('targetLanguage', 'en'),
        provider: config.get('translationProvider', 'google'),
        libreTranslateUrl: config.get('libreTranslateUrl', 'https://libretranslate.de')
    };
}

/**
 * Deshace la última traducción
 */
async function undoLastTranslation(): Promise<void> {
    const lastEntry = historyManager.getLast();

    if (!lastEntry) {
        vscode.window.showWarningMessage('No translation to undo');
        return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    try {
        const line = editor.document.lineAt(lastEntry.lineNumber);
        await editor.edit(editBuilder => {
            editBuilder.replace(line.range, lastEntry.originalText);
        });

        vscode.window.showInformationMessage(`Undid translation at line ${lastEntry.lineNumber + 1}`);
        translatedCount--;
        updateStatusBar();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to undo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Traduce el texto seleccionado (debe ser un comentario)
 */
async function translateSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (!selectedText) {
        vscode.window.showWarningMessage('Please select a comment to translate');
        return;
    }

    try {
        const config = getTranslationConfig();
        const languageId = editor.document.languageId;

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Translating comment...',
                cancellable: false
            },
            async () => {
                const options: TranslationOptions = {
                    text: selectedText,
                    sourceLang: config.sourceLang,
                    targetLang: config.targetLang,
                    provider: config.provider,
                    libreTranslateUrl: config.libreTranslateUrl
                };

                const result = await translationService.translate(options);

                // Guardar en historial
                historyManager.add({
                    lineNumber: selection.start.line,
                    originalText: selectedText,
                    translatedText: result.translatedText,
                    timestamp: new Date()
                });

                // Reemplazar el texto
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, result.translatedText);
                });

                translatedCount++;
                updateStatusBar();

                vscode.window.showInformationMessage(
                    `✅ Translated from ${result.sourceLang} to ${result.targetLang}`
                );
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(
            `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Traduce todos los comentarios en el archivo actual
 */
async function translateAllComments() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    const document = editor.document;
    const config = getTranslationConfig();
    const languageId = document.languageId;

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Translating all comments...',
                cancellable: true
            },
            async (progress, token) => {
                const edits: { range: vscode.Range; text: string }[] = [];
                let count = 0;

                // Recolectar comentarios
                const comments: { line: number; info: any }[] = [];
                for (let i = 0; i < document.lineCount; i++) {
                    const line = document.lineAt(i);
                    const commentInfo = translationService.extractComment(line.text, languageId);

                    if (commentInfo) {
                        comments.push({ line: i, info: commentInfo });
                    }
                }

                if (comments.length === 0) {
                    vscode.window.showInformationMessage('No comments found to translate');
                    return;
                }

                // Traducir todos
                for (let i = 0; i < comments.length; i++) {
                    if (token.isCancellationRequested) {
                        break;
                    }

                    const { line: lineNum, info } = comments[i];

                    progress.report({
                        message: `${i + 1}/${comments.length} comments`,
                        increment: (100 / comments.length)
                    });

                    try {
                        const options: TranslationOptions = {
                            text: info.comment,
                            sourceLang: config.sourceLang,
                            targetLang: config.targetLang,
                            provider: config.provider,
                            libreTranslateUrl: config.libreTranslateUrl
                        };

                        const result = await translationService.translate(options);
                        const translatedLine = info.prefix + result.translatedText + info.suffix;

                        const line = document.lineAt(lineNum);

                        // Guardar en historial
                        historyManager.add({
                            lineNumber: lineNum,
                            originalText: line.text,
                            translatedText: translatedLine,
                            timestamp: new Date()
                        });

                        edits.push({
                            range: line.range,
                            text: translatedLine
                        });

                        count++;

                        // Pequeño delay
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        console.error(`Failed to translate line ${lineNum}:`, error);
                    }
                }

                // Aplicar ediciones
                if (edits.length > 0) {
                    await editor.edit(editBuilder => {
                        for (const edit of edits) {
                            editBuilder.replace(edit.range, edit.text);
                        }
                    });

                    translatedCount += count;
                    updateStatusBar();

                    const selection = await vscode.window.showInformationMessage(
                        `✅ Successfully translated ${count} comments`,
                        'Undo Last',
                        'View Stats'
                    );

                    if (selection === 'Undo Last') {
                        vscode.commands.executeCommand('comment-translator.undoLastTranslation');
                    } else if (selection === 'View Stats') {
                        vscode.commands.executeCommand('comment-translator.showStats');
                    }
                }
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(
            `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Provee un hover con la traducción del comentario
 */
async function provideCommentHover(
    document: vscode.TextDocument,
    position: vscode.Position
): Promise<vscode.Hover | null> {
    const line = document.lineAt(position.line);
    const languageId = document.languageId;
    const commentInfo = translationService.extractComment(line.text, languageId);

    if (!commentInfo) {
        return null;
    }

    try {
        const config = getTranslationConfig();

        const options: TranslationOptions = {
            text: commentInfo.comment,
            sourceLang: config.sourceLang,
            targetLang: config.targetLang,
            provider: config.provider,
            libreTranslateUrl: config.libreTranslateUrl
        };

        const result = await translationService.translate(options);

        const hoverContent = new vscode.MarkdownString();
        hoverContent.appendMarkdown(`**🌍 Translation** (${result.sourceLang} → ${result.targetLang})\n\n`);
        hoverContent.appendText(result.translatedText);
        hoverContent.appendMarkdown(`\n\n---\n\n*Click to translate permanently*`);

        return new vscode.Hover(hoverContent);
    } catch (error) {
        console.error('Hover translation failed:', error);
        return null;
    }
}
