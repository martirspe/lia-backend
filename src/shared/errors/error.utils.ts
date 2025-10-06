// Formatea cualquier error en un mensaje legible para logging y respuesta.
export function formatError(error: any): string {
  if (!error) return 'Error desconocido';
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    return `${error.message}${error.stack ? '\n' + error.stack : ''}`;
  }
  if (typeof error === 'object') {
    // Si tiene message y stack, muéstralos
    const msg = error.message ? `Mensaje: ${error.message}` : '';
    const stack = error.stack ? `\nStack: ${error.stack}` : '';
    return `${msg}${stack}` || JSON.stringify(error, null, 2);
  }
  return String(error);
}