import axios from 'axios';

/**
 * Interface para el resultado de traducción
 */
export interface TranslationResult {
    translatedText: string;
    sourceLang?: string;
    targetLang: string;
}

/**
 * Opciones de traducción
 */
export interface TranslationOptions {
    text: string;
    sourceLang: string;
    targetLang: string;
    provider: 'google' | 'libretranslate';
    libreTranslateUrl?: string;
}

/**
 * Caché de traducciones para evitar llamadas duplicadas a la API
 */
class TranslationCache {
    private cache: Map<string, TranslationResult> = new Map();
    private maxSize: number = 1000; // Máximo de traducciones en caché

    getCacheKey(text: string, targetLang: string): string {
        // Normalizar el texto para mejor matching
        const normalizedText = text.trim().toLowerCase();
        return `${normalizedText}::${targetLang}`;
    }

    get(text: string, targetLang: string): TranslationResult | undefined {
        return this.cache.get(this.getCacheKey(text, targetLang));
    }

    set(text: string, targetLang: string, result: TranslationResult): void {
        // Si el caché está lleno, eliminar el primer elemento
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(this.getCacheKey(text, targetLang), result);
    }

    clear(): void {
        this.cache.clear();
    }

    getSize(): number {
        return this.cache.size;
    }
}

/**
 * Patrones de comentarios para diferentes lenguajes
 */
interface CommentPattern {
    singleLine?: RegExp[];
    blockStart?: RegExp;
    blockMiddle?: RegExp;
    blockEnd?: RegExp;
    inlineBlock?: RegExp;
}

/**
 * Servicio de traducción que soporta múltiples proveedores
 */
export class TranslationService {
    private cache = new TranslationCache();
    private commentPatterns: { [key: string]: CommentPattern } = {
        'javascript': {
            singleLine: [/^(\s*\/\/\s*)(.+)$/],
            inlineBlock: /^(\s*\/\*\s*)(.+?)(\s*\*\/\s*)$/,
            blockStart: /^(\s*\/\*\s*)(.+)$/,
            blockMiddle: /^(\s*\*\s*)(.+)$/,
            blockEnd: /^(\s*)(.+?)(\s*\*\/\s*)$/
        },
        'typescript': {
            singleLine: [/^(\s*\/\/\s*)(.+)$/],
            inlineBlock: /^(\s*\/\*\s*)(.+?)(\s*\*\/\s*)$/,
            blockStart: /^(\s*\/\*\s*)(.+)$/,
            blockMiddle: /^(\s*\*\s*)(.+)$/,
            blockEnd: /^(\s*)(.+?)(\s*\*\/\s*)$/
        },
        'python': {
            singleLine: [
                /^(\s*#\s*)(.+)$/,           // # comentario
                /^(\s*"""\s*)(.+)$/,         // """ docstring
                /^(\s*'''\s*)(.+)$/          // ''' docstring
            ]
        },
        'html': {
            singleLine: [/^(\s*<!--\s*)(.+?)(\s*-->\s*)$/]
        },
        'css': {
            inlineBlock: /^(\s*\/\*\s*)(.+?)(\s*\*\/\s*)$/,
            blockStart: /^(\s*\/\*\s*)(.+)$/,
            blockEnd: /^(\s*)(.+?)(\s*\*\/\s*)$/
        },
        'ruby': {
            singleLine: [/^(\s*#\s*)(.+)$/]
        },
        'php': {
            singleLine: [/^(\s*\/\/\s*)(.+)$/, /^(\s*#\s*)(.+)$/],
            inlineBlock: /^(\s*\/\*\s*)(.+?)(\s*\*\/\s*)$/
        }
    };

    /**
     * Traduce texto usando el proveedor especificado con caché
     */
    async translate(options: TranslationOptions): Promise<TranslationResult> {
        // Verificar caché primero
        const cached = this.cache.get(options.text, options.targetLang);
        if (cached) {
            return cached;
        }

        // Si no está en caché, traducir
        let result: TranslationResult;
        if (options.provider === 'libretranslate') {
            result = await this.translateWithLibreTranslate(options);
        } else {
            result = await this.translateWithGoogle(options);
        }

        // Guardar en caché
        this.cache.set(options.text, options.targetLang, result);

        return result;
    }

    /**
     * Traduce múltiples textos en batch (más eficiente)
     */
    async translateBatch(texts: string[], options: Omit<TranslationOptions, 'text'>): Promise<TranslationResult[]> {
        const results: TranslationResult[] = [];

        for (const text of texts) {
            try {
                const result = await this.translate({
                    ...options,
                    text
                });
                results.push(result);
            } catch (error) {
                // Si falla uno, continuar con los demás
                results.push({
                    translatedText: text, // Mantener original si falla
                    sourceLang: options.sourceLang,
                    targetLang: options.targetLang
                });
            }
        }

        return results;
    }

    /**
     * Limpia el caché de traducciones
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Obtiene el tamaño actual del caché
     */
    getCacheSize(): number {
        return this.cache.getSize();
    }

    /**
     * Traduce usando Google Translate (API no oficial pero gratuita)
     * Usa un endpoint público que simula la API de Google
     */
    private async translateWithGoogle(options: TranslationOptions): Promise<TranslationResult> {
        try {
            const { text, sourceLang, targetLang } = options;

            // Usamos la API pública de Google Translate
            const url = 'https://translate.googleapis.com/translate_a/single';
            const params = {
                client: 'gtx',
                sl: sourceLang === 'auto' ? 'auto' : sourceLang,
                tl: targetLang,
                dt: 't',
                q: text
            };

            const response = await axios.get(url, { params });

            // La respuesta es un array complejo, extraemos el texto traducido
            const translatedText = response.data[0]
                .map((item: any) => item[0])
                .join('');

            // Detectar idioma fuente si era 'auto'
            const detectedLang = response.data[2] || sourceLang;

            return {
                translatedText: translatedText.trim(),
                sourceLang: detectedLang,
                targetLang
            };
        } catch (error) {
            throw new Error(`Google Translate error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Traduce usando LibreTranslate (requiere una instancia corriendo)
     */
    private async translateWithLibreTranslate(options: TranslationOptions): Promise<TranslationResult> {
        try {
            const { text, sourceLang, targetLang, libreTranslateUrl } = options;

            if (!libreTranslateUrl) {
                throw new Error('LibreTranslate URL is not configured');
            }

            const response = await axios.post(`${libreTranslateUrl}/translate`, {
                q: text,
                source: sourceLang,
                target: targetLang,
                format: 'text'
            });

            return {
                translatedText: response.data.translatedText,
                sourceLang: response.data.detectedLanguage?.language || sourceLang,
                targetLang
            };
        } catch (error) {
            throw new Error(`LibreTranslate error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Extrae comentarios de una línea de código según el lenguaje
     * Soporta JavaScript, TypeScript, Python, HTML, CSS, Ruby, PHP
     */
    extractComment(line: string, languageId?: string): { comment: string; prefix: string; suffix: string } | null {
        // Por defecto usar JavaScript/TypeScript
        const lang = languageId || 'javascript';
        const patterns = this.commentPatterns[lang] || this.commentPatterns['javascript'];

        // Probar patrones de línea simple
        if (patterns.singleLine) {
            for (const pattern of patterns.singleLine) {
                const match = line.match(pattern);
                if (match) {
                    return {
                        prefix: match[1],
                        comment: match[2],
                        suffix: match[3] || ''
                    };
                }
            }
        }

        // Comentario de bloque en línea (/* ... */ o <!-- ... -->)
        if (patterns.inlineBlock) {
            const match = line.match(patterns.inlineBlock);
            if (match) {
                return {
                    prefix: match[1],
                    comment: match[2],
                    suffix: match[3]
                };
            }
        }

        // Comentario multilínea - inicio
        if (patterns.blockStart) {
            const match = line.match(patterns.blockStart);
            if (match) {
                return {
                    prefix: match[1],
                    comment: match[2],
                    suffix: ''
                };
            }
        }

        // Comentario multilínea - línea intermedia
        if (patterns.blockMiddle) {
            const match = line.match(patterns.blockMiddle);
            if (match) {
                return {
                    prefix: match[1],
                    comment: match[2],
                    suffix: ''
                };
            }
        }

        // Comentario multilínea - línea final
        if (patterns.blockEnd && line.includes('*/')) {
            const match = line.match(patterns.blockEnd);
            if (match) {
                return {
                    prefix: match[1],
                    comment: match[2],
                    suffix: match[3]
                };
            }
        }

        return null;
    }

    /**
     * Verifica si una línea contiene un comentario (versión mejorada)
     */
    isComment(line: string, languageId?: string): boolean {
        const trimmed = line.trim();
        const lang = languageId || 'javascript';

        // Patrones comunes
        if (trimmed.startsWith('//') ||
            trimmed.startsWith('/*') ||
            trimmed.startsWith('*') ||
            trimmed.includes('*/')) {
            return true;
        }

        // Python
        if (lang === 'python') {
            return trimmed.startsWith('#') ||
                trimmed.startsWith('"""') ||
                trimmed.startsWith("'''");
        }

        // HTML
        if (lang === 'html') {
            return trimmed.startsWith('<!--') || trimmed.endsWith('-->');
        }

        return false;
    }
}
