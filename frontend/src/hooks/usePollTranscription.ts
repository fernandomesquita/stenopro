import { useEffect, useRef } from 'react';

/**
 * Hook para polling de transcrições em processamento
 *
 * Faz polling a cada 3 segundos enquanto o status estiver em:
 * - uploading
 * - transcribing
 * - correcting
 *
 * Para automaticamente quando o status for:
 * - ready
 * - error
 * - archived
 *
 * @param transcriptionId - ID da transcrição
 * @param refetch - Função para recarregar os dados
 */
export function usePollTranscription(
  transcriptionId: number | undefined,
  refetch: () => void,
  status?: string
) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Limpar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Não iniciar polling se não tiver ID
    if (!transcriptionId) {
      return;
    }

    // Status que requerem polling
    const processingStatuses = ['uploading', 'transcribing', 'correcting'];

    // Se status não foi fornecido ou está em processamento, iniciar polling
    if (!status || processingStatuses.includes(status)) {
      intervalRef.current = window.setInterval(() => {
        console.log(`[Poll] Atualizando transcrição ${transcriptionId}...`);
        refetch();
      }, 3000); // 3 segundos
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [transcriptionId, status, refetch]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
