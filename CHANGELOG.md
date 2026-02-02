# Change Log

All notable changes to the "comment-translator" extension will be documented in this file.

## [0.1.0] - 2026-02-02

### Added - Major Update! 🎉
- **Translation Cache System**: Traducciones ahora se guardan en caché para mejor performance
- **Multi-Language Support**: Soporte completo para Python, HTML, CSS, Ruby, PHP además de JavaScript/TypeScript
- **Status Bar Integration**: Barra de estado que muestra estadísticas en tiempo real
- **Translation History & Undo**: Sistema de historial completo con función de deshacer
- **Batch Translation**: Traducción optimizada de múltiples comentarios
- **Context Menu**: Opción de traducir en el menú contextual (clic derecho)
- **New Commands**:
  - `Undo Last Translation`: Deshace la última traducción
  - `Clear Translation Cache`: Limpia el caché de traducciones
  - `Show Statistics`: Muestra estadísticas detalladas
- **Enhanced UX**: Notificaciones mejoradas con acciones rápidas
- **Language-Aware Parsing**: Detecta automáticamente el lenguaje del archivo

### Improved
- Mejor detección de comentarios con soporte para múltiples formatos
- Performance mejorado con sistema de caché (hasta 1000 traducciones)
- Mensajes más informativos y útiles
- Hover tooltips con mejor formato

### Technical
- Nuevo módulo `history.ts` para gestión de historial
- Arquitectura mejorada con variables globales compartidas
- Soporte para TypeScript, Python, HTML, CSS, Ruby, PHP
- Compilación exitosa sin errores ni warnings

## [0.0.1] - 2026-02-01

### Added
- Initial release
- Translate selected comment command
- Translate all comments in file command
- Hover translation feature (view translation without modifying code)
- Support for multiple languages (EN, ES, FR, DE, IT, PT, RU, ZH, JA)
- Auto-detect source language
- Multiple translation providers (Google Translate, LibreTranslate)
- Configuration options for target language, source language, and provider
- Support for single-line comments (//)
- Support for block comments (/* */)
- Support for multi-line block comments
- Progress indicator for long translations
- Error handling and user-friendly messages

### Known Issues
- Translation speed depends on internet connection
- Large files may take a while to translate
- Some technical terms might not translate perfectly
