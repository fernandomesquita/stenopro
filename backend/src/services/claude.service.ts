import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db/client.js';
import { systemPrompts, glossaries } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export class ClaudeService {
  private client: Anthropic;
  
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  /**
   * Corrige e formata um texto bruto seguindo as normas parlamentares
   * 
   * @param rawText - Texto bruto da transcrição
   * @param transcriptionId - ID da transcrição (para buscar glossário específico)
   * @returns Texto corrigido e formatado
   */
  async correctText(rawText: string, transcriptionId?: number): Promise<{
    text: string;
    tokensUsed: { input: number; output: number };
  }> {
    try {
      console.log(`[Claude] Corrigindo texto (${rawText.length} chars)`);
      
      const startTime = Date.now();
      
      // Buscar prompt ativo
      const activePrompt = await this.getActivePrompt();
      
      // Buscar glossário (global + específico da transcrição)
      const glossary = await this.getGlossary(transcriptionId);
      
      // Construir prompt completo
      const prompt = this.buildPrompt(activePrompt, rawText, glossary);
      
      // Chamar Claude API
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      // Extrair texto da resposta (pode ser TextBlock ou ToolUseBlock)
      const firstBlock = message.content[0];
      const correctedText = firstBlock.type === 'text' ? firstBlock.text : '';

      console.log(`[Claude] ✅ Concluído em ${elapsed}s`);
      console.log(`[Claude] Tokens: ${message.usage.input_tokens} input + ${message.usage.output_tokens} output`);
      console.log(`[Claude] Caracteres: ${correctedText.length}`);

      return {
        text: correctedText,
        tokensUsed: {
          input: message.usage.input_tokens,
          output: message.usage.output_tokens,
        },
      };
    } catch (error: any) {
      console.error('[Claude] ❌ Erro na correção:', error?.message || error);
      throw new Error(`Falha na correção: ${error?.message || 'Erro desconhecido'}`);
    }
  }
  
  /**
   * Busca o prompt ativo do sistema
   */
  private async getActivePrompt(): Promise<string> {
    const [prompt] = await db
      .select()
      .from(systemPrompts)
      .where(eq(systemPrompts.isActive, true))
      .limit(1);
    
    if (!prompt) {
      // Retornar prompt padrão se não houver nenhum ativo
      return this.getDefaultPrompt();
    }
    
    return prompt.content;
  }
  
  /**
   * Busca glossário global e específico da transcrição
   */
  private async getGlossary(transcriptionId?: number): Promise<string> {
    const entries = await db
      .select()
      .from(glossaries)
      .where(
        transcriptionId
          ? and(
              eq(glossaries.isGlobal, true),
              eq(glossaries.transcriptionId, transcriptionId)
            )
          : eq(glossaries.isGlobal, true)
      );
    
    if (entries.length === 0) {
      return '';
    }
    
    return entries
      .map(entry => `${entry.name} - ${entry.info || ''}`)
      .join('\n');
  }
  
  /**
   * Constrói o prompt completo
   */
  private buildPrompt(systemPrompt: string, rawText: string, glossary: string): string {
    let prompt = systemPrompt;
    
    prompt += `\n\n# TRANSCRIÇÃO BRUTA:\n${rawText}`;
    
    if (glossary) {
      prompt += `\n\n# GLOSSÁRIO (consultar para grafia correta dos nomes):\n${glossary}`;
    }
    
    prompt += `\n\n# TAREFA:\nRevise e corrija o texto da TRANSCRIÇÃO BRUTA acima seguindo RIGOROSAMENTE as instruções de formatação.\n`;
    
    if (glossary) {
      prompt += `Use o GLOSSÁRIO para garantir a grafia correta dos nomes.\n`;
    }
    
    prompt += `Retorne APENAS o texto formatado, sem comentários adicionais.\nMarque o final com: (Fim da transcrição)`;
    
    return prompt;
  }
  
  /**
   * Retorna o prompt padrão do sistema
   */
  private getDefaultPrompt(): string {
    return `✅ INSTRUÇÕES DE REVISÃO E EDIÇÃO TEXTUAL

1. Correção Gramatical com Fidelidade
* Corrigir somente o necessário para garantir correção gramatical e fluidez textual. 
* Evitar alterações de estilo, mesmo que o termo esteja correto mas diferente do usual do orador. 
* Jamais trocar o certo pelo certo.
* Respeitar a oralidade do orador, inclusive vocabulário, tom, estrutura e repetições enfáticas. 

2. Formato das Transcrições
* Sempre usar o formato de nota taquigráfica, com: 
   * Parágrafos bem divididos de acordo com o assunto 
   * Correção gramatical 
   * Fidelidade ao conteúdo e estilo original do orador 
* Usar CAIXA ALTA para o nome do orador, seguido do cargo em negrito. Exemplo: O SR. PRESIDENTE (Alberto Fraga. PL-DF) - Muito obrigado.
* Sempre que possível, identificar corretamente os oradores com nome completo e partido.

3. Tratamento de Falas Intercaladas
* Quando houver manifestações intercaladas, manter o estilo de taquigrafia.
* Usar expressões como "interpela", "interrompe", "aparte", se relevante.

✅ ORIENTAÇÕES DE CONTEÚDO

1. Sobre o Estilo
* Manter um estilo institucional e respeitoso, sem editorializações.

2. Citações Legislativas
* Manter menções a artigos, leis, emendas, etc., com correções apenas gramaticais.

3. Erros Factuais
* Não corrigir erros factuais dos oradores. Refletir a fala real.

✅ SOBRE A ORGANIZAÇÃO

1. Revisar o Texto Completo
* Revisar o conteúdo completo, sem interrupções.
* Não inventar o que não foi dito.
* Marcar o final com (Fim da transcrição)

✅ Iniciais maiúsculas:
* Deputado, Presidente, Relator, Ministro
* País e Nação (quando se referirem ao Brasil)
* Comissão (órgão da Câmara)
* Estado (da Federação) e Município

✅ Abreviações:
* "Senhor Presidente" → "Sr. Presidente"
* "Senhor Deputado" → "Sr. Deputado"`;
  }
}

// Singleton export
export const claudeService = new ClaudeService();
