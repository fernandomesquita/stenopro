import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip,
  BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';

interface TranscriptionData {
  id: number;
  title: string;
  room?: string;
  created_at: string;
  duration?: string;
  finalText: string;
  stats?: {
    final: { words: number; characters: number };
    deputiesCount: number;
    glossaryTermsCount: number;
  };
}

export class DocxExportService {

  /**
   * Parse HTML do Quill para elementos DOCX
   */
  private static parseHtmlToDocxElements(html: string): Paragraph[] {
    if (!html) return [];

    console.log('[DocxExport] Parsing HTML, length:', html.length);

    const paragraphs: Paragraph[] = [];

    // Remover tags HTML e processar
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    // Processar cada parágrafo
    const processNode = (node: Node, parentItalic = false, parentHighlight?: string): TextRun[] => {
      const runs: TextRun[] = [];

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text.trim()) {
          runs.push(new TextRun({
            text: text,
            size: 24, // 12pt
            italics: parentItalic,
            highlight: parentHighlight as any,
          }));
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        // Determinar formatação deste elemento
        let isItalic = parentItalic;
        let backgroundColor = parentHighlight;

        if (tagName === 'em' || tagName === 'i') {
          isItalic = true;
        }

        if (tagName === 'mark' || element.style.backgroundColor) {
          const bgColor = element.style.backgroundColor || 'yellow';
          backgroundColor = this.htmlColorToDocx(bgColor);
        }

        // Processar filhos recursivamente
        if (element.childNodes.length > 0) {
          element.childNodes.forEach(child => {
            const childRuns = processNode(child, isItalic, backgroundColor);
            runs.push(...childRuns);
          });
        }
      }

      return runs;
    };

    // Processar parágrafos
    const paragraphElements = body.querySelectorAll('p');

    if (paragraphElements.length === 0) {
      // Fallback: dividir por quebras de linha
      const lines = html.split(/\n+/).filter(line => line.trim());
      lines.forEach(line => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = line;
        const runs = processNode(tempDiv);

        if (runs.length > 0) {
          paragraphs.push(new Paragraph({
            children: runs,
            spacing: { after: 200 }
          }));
        }
      });
    } else {
      paragraphElements.forEach(p => {
        const runs = processNode(p);

        if (runs.length > 0) {
          paragraphs.push(new Paragraph({
            children: runs,
            spacing: { after: 200 }
          }));
        }
      });
    }

    console.log('[DocxExport] Parsed paragraphs:', paragraphs.length);
    return paragraphs;
  }

  /**
   * Converter cor HTML para DOCX
   */
  private static htmlColorToDocx(color: string): string {
    const colorMap: { [key: string]: string } = {
      'yellow': 'yellow',
      'rgb(255, 255, 0)': 'yellow',
      '#ffff00': 'yellow',
      'rgb(255, 107, 107)': 'red',
      '#ff6b6b': 'red',
      'rgb(78, 205, 196)': 'cyan',
      '#4ecdc4': 'cyan',
      'rgb(149, 225, 211)': 'green',
      '#95e1d3': 'green',
      'rgb(243, 129, 129)': 'red',
      '#f38181': 'red',
      'rgb(254, 202, 87)': 'yellow',
      '#feca57': 'yellow',
    };

    return colorMap[color.toLowerCase()] || 'yellow';
  }

  /**
   * Exportar transcrição para DOCX
   */
  static async exportToDocx(data: TranscriptionData): Promise<void> {
    console.group('[DocxExport] === EXPORTANDO DOCX ===');
    console.log('Title:', data.title);
    console.log('Text length:', data.finalText?.length || 0);

    try {
      const doc = new Document({
        creator: 'StenoPro - Fernando Mesquita',
        title: data.title,
        description: 'Transcrição processada via StenoPro',

        sections: [{
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
              },
            },
          },

          // Header
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'CÂMARA DOS DEPUTADOS',
                      bold: true,
                      size: 28,
                      color: '1a1a1a',
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  border: {
                    bottom: {
                      color: '000000',
                      space: 1,
                      style: BorderStyle.SINGLE,
                      size: 6,
                    },
                  },
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'StenoPro - Sistema de Transcrição',
                      size: 18,
                      color: '666666',
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                }),
              ],
            }),
          },

          // Footer
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  border: {
                    top: {
                      color: '000000',
                      space: 1,
                      style: BorderStyle.SINGLE,
                      size: 6,
                    },
                  },
                  spacing: { before: 200 },
                  children: [
                    new TextRun({
                      text: 'Página ',
                      size: 18,
                      color: '666666',
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 18,
                      color: '666666',
                    }),
                    new TextRun({
                      text: ' de ',
                      size: 18,
                      color: '666666',
                    }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                      size: 18,
                      color: '666666',
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100 },
                  children: [
                    new TextRun({
                      text: 'Desenvolvido por Fernando Mesquita',
                      size: 16,
                      color: '999999',
                      italics: true,
                    }),
                  ],
                }),
              ],
            }),
          },

          children: [
            // Título Principal
            new Paragraph({
              text: data.title,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Metadados
            new Paragraph({
              children: [
                new TextRun({
                  text: '📋 INFORMAÇÕES DA TRANSCRIÇÃO',
                  bold: true,
                  size: 22,
                  color: '1a73e8',
                }),
              ],
              spacing: { after: 200 },
            }),

            ...(data.room ? [new Paragraph({
              children: [
                new TextRun({ text: 'Sala: ', bold: true, size: 22 }),
                new TextRun({ text: data.room, size: 22 }),
              ],
              spacing: { after: 100 },
            })] : []),

            new Paragraph({
              children: [
                new TextRun({ text: 'Data: ', bold: true, size: 22 }),
                new TextRun({
                  text: new Date(data.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  size: 22
                }),
              ],
              spacing: { after: 100 },
            }),

            ...(data.duration ? [new Paragraph({
              children: [
                new TextRun({ text: 'Duração: ', bold: true, size: 22 }),
                new TextRun({ text: data.duration, size: 22 }),
              ],
              spacing: { after: 100 },
            })] : []),

            // Estatísticas
            ...(data.stats ? [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Palavras: ', bold: true, size: 22 }),
                  new TextRun({ text: data.stats.final.words.toString(), size: 22 }),
                  new TextRun({ text: ' | ', size: 22 }),
                  new TextRun({ text: 'Caracteres: ', bold: true, size: 22 }),
                  new TextRun({ text: data.stats.final.characters.toLocaleString(), size: 22 }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Deputados mencionados: ', bold: true, size: 22 }),
                  new TextRun({ text: data.stats.deputiesCount.toString(), size: 22 }),
                  new TextRun({ text: ' | ', size: 22 }),
                  new TextRun({ text: 'Termos do glossário: ', bold: true, size: 22 }),
                  new TextRun({ text: data.stats.glossaryTermsCount.toString(), size: 22 }),
                ],
                spacing: { after: 400 },
              }),
            ] : []),

            // Separador
            new Paragraph({
              text: '─'.repeat(80),
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Título do Conteúdo
            new Paragraph({
              children: [
                new TextRun({
                  text: '📄 TRANSCRIÇÃO',
                  bold: true,
                  size: 22,
                  color: '1a73e8',
                }),
              ],
              spacing: { after: 300 },
            }),

            // Conteúdo Principal
            ...this.parseHtmlToDocxElements(data.finalText || ''),
          ],
        }],
      });

      // Gerar blob
      const { Packer } = await import('docx');
      const blob = await Packer.toBlob(doc);

      // Salvar arquivo
      const filename = `${data.title.replace(/[^a-z0-9]/gi, '_')}_${data.id}.docx`;
      saveAs(blob, filename);

      console.log('[DocxExport] ✅ Arquivo gerado:', filename);
      console.groupEnd();

    } catch (error: any) {
      console.error('[DocxExport] ❌ Erro:', error);
      console.groupEnd();
      throw error;
    }
  }
}
