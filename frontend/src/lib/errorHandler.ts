/**
 * Error handler utility for mapping Supabase/PostgreSQL errors to user-friendly messages.
 * This prevents leaking internal database structure, table names, and RLS policy details.
 */

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

/**
 * Maps Supabase/PostgreSQL error codes to user-friendly Portuguese messages.
 * Logs detailed error information to console for debugging purposes only.
 */
export function mapSupabaseError(error: SupabaseError | Error | unknown): string {
  // Log detailed error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error('[Database Error]', error);
  }

  // Handle null/undefined
  if (!error) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  // Extract error code if available
  const errorObj = error as SupabaseError;
  const code = errorObj.code;

  // Map common PostgreSQL error codes to user-friendly messages
  if (code) {
    switch (code) {
      // Permission/RLS errors
      case '42501':
        return 'Você não tem permissão para realizar esta ação.';
      
      // Unique constraint violation
      case '23505':
        return 'Este registro já existe no sistema.';
      
      // Foreign key violation
      case '23503':
        return 'Registro relacionado não encontrado.';
      
      // Check constraint violation
      case '23514':
        return 'Os dados fornecidos são inválidos. Verifique os campos e tente novamente.';
      
      // Not null violation
      case '23502':
        return 'Por favor, preencha todos os campos obrigatórios.';
      
      // Invalid text representation
      case '22P02':
        return 'Formato de dados inválido.';
      
      // String data right truncation
      case '22001':
        return 'O texto inserido é muito longo.';
      
      // Numeric value out of range
      case '22003':
        return 'O valor numérico está fora do intervalo permitido.';
      
      // Division by zero
      case '22012':
        return 'Erro de cálculo. Verifique os valores inseridos.';
      
      // Invalid datetime format
      case '22007':
        return 'Formato de data/hora inválido.';
      
      // Insufficient privilege
      case '42000':
        return 'Você não tem privilégios suficientes para esta ação.';
      
      // Connection exception
      case '08000':
      case '08003':
      case '08006':
        return 'Erro de conexão. Verifique sua internet e tente novamente.';
      
      // Query timeout
      case '57014':
        return 'A operação demorou muito. Tente novamente.';
      
      default:
        // Unknown error code - return generic message
        break;
    }
  }

  // Check for common error message patterns (as fallback)
  const message = errorObj.message || '';
  
  if (message.includes('row-level security')) {
    return 'Você não tem permissão para realizar esta ação.';
  }
  
  if (message.includes('duplicate key')) {
    return 'Este registro já existe no sistema.';
  }
  
  if (message.includes('violates foreign key')) {
    return 'Registro relacionado não encontrado.';
  }
  
  if (message.includes('violates check constraint')) {
    return 'Os dados fornecidos são inválidos. Verifique os campos e tente novamente.';
  }
  
  if (message.includes('not authenticated') || message.includes('Not authenticated')) {
    return 'Você precisa estar logado para realizar esta ação.';
  }
  
  if (message.includes('JWT') || message.includes('token')) {
    return 'Sua sessão expirou. Por favor, faça login novamente.';
  }

  // Default generic message
  return 'Ocorreu um erro. Por favor, tente novamente.';
}

/**
 * Creates an Error with a user-friendly message while preserving the original error for logging.
 */
export function createUserFriendlyError(error: unknown): Error {
  const userMessage = mapSupabaseError(error);
  return new Error(userMessage);
}
