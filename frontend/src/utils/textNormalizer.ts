/**
 * Normaliza texto removendo HTML e mantendo apenas conteúdo
 */
export class TextNormalizer {

  /**
   * Remove todas as tags HTML mas preserva estrutura de parágrafos
   */
  static stripHtml(html: string): string {
    if (!html) return '';

    console.log('[TextNormalizer] Stripping HTML, length:', html.length);

    // Criar parser DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extrair texto mantendo quebras de linha
    const extractText = (node: Node): string => {
      let text = '';

      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent || '';
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const element = child as HTMLElement;
          const tagName = element.tagName.toLowerCase();

          // Adicionar quebra antes de certos elementos
          if (['p', 'div', 'br', 'h1', 'h2', 'h3'].includes(tagName)) {
            if (text && !text.endsWith('\n')) {
              text += '\n';
            }
          }

          // Recursivamente extrair texto dos filhos
          text += extractText(child);

          // Adicionar quebra depois de certos elementos
          if (['p', 'div', 'h1', 'h2', 'h3'].includes(tagName)) {
            if (!text.endsWith('\n')) {
              text += '\n';
            }
          }
        }
      });

      return text;
    };

    let text = extractText(doc.body);

    // Normalizar múltiplas quebras de linha
    text = text.replace(/\n{3,}/g, '\n\n');

    // Normalizar espaços
    text = text.replace(/[ \t]+/g, ' ');

    // Remover espaços no início/fim de linhas
    text = text.split('\n').map(line => line.trim()).join('\n');

    // Remover linhas vazias consecutivas
    text = text.replace(/\n\n+/g, '\n\n');

    text = text.trim();

    console.log('[TextNormalizer] Stripped, new length:', text.length);
    return text;
  }

  /**
   * Normaliza texto para comparação
   */
  static normalizeForComparison(text: string): string {
    // Se parece HTML, strip primeiro
    if (text.includes('<') && text.includes('>')) {
      text = this.stripHtml(text);
    }

    // Normalizar espaços em branco
    text = text.replace(/\s+/g, ' ');

    // Normalizar quebras de linha
    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\r/g, '\n');

    // Remover espaços antes/depois de quebras
    text = text.replace(/ *\n */g, '\n');

    // Normalizar múltiplas quebras
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
  }

  /**
   * Compara dois textos ignorando formatação HTML
   */
  static areEqual(text1: string, text2: string): boolean {
    const normalized1 = this.normalizeForComparison(text1);
    const normalized2 = this.normalizeForComparison(text2);
    return normalized1 === normalized2;
  }
}
