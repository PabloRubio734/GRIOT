/** Error con un mensaje en español apto para el estudiante y un código HTTP. */
export class MentorError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly status: number,
    /** Etiqueta corta para los logs. Nunca contiene texto de la conversación. */
    public readonly code: string,
  ) {
    super(code);
  }
}
