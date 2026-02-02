/**
 * Sistema de historial de traducciones para permitir deshacer
 */

export interface TranslationHistoryEntry {
    lineNumber: number;
    originalText: string;
    translatedText: string;
    timestamp: Date;
}

export class TranslationHistoryManager {
    private history: TranslationHistoryEntry[] = [];
    private maxHistory: number = 50;

    /**
     * Agrega una entrada al historial
     */
    add(entry: TranslationHistoryEntry): void {
        // Limitar el tamaño del historial
        if (this.history.length >= this.maxHistory) {
            this.history.shift(); // Eliminar la más antigua
        }
        this.history.push(entry);
    }

    /**
     * Obtiene y remueve la última entrada del historial
     */
    getLast(): TranslationHistoryEntry | undefined {
        return this.history.pop();
    }

    /**
     * Obtiene todas las entradas del historial sin removerlas
     */
    getAll(): TranslationHistoryEntry[] {
        return [...this.history];
    }

    /**
     * Limpia todo el historial
     */
    clear(): void {
        this.history = [];
    }

    /**
     * Obtiene la cantidad de entradas en el historial
     */
    getSize(): number {
        return this.history.length;
    }
}
