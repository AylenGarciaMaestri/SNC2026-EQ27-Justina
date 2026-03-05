import type { RunResult } from "../lib/organData";

const LAST_RUN_KEY = "justina_last_run";
const HISTORY_KEY = "justina_run_history";

export function useRunHistory() {
  /**
   * Guarda el run como el último resultado.
   * En el historial hace un UPSERT por id: si ya existe un run del mismo
   * procedimiento lo reemplaza (repetición), si no existe lo agrega al frente.
   */
  const saveRun = (run: RunResult): void => {
    localStorage.setItem(LAST_RUN_KEY, JSON.stringify(run));

    const prev: RunResult[] = JSON.parse(
      localStorage.getItem(HISTORY_KEY) ?? "[]"
    );
    // Eliminar entrada previa del mismo procedimiento (si existe)
    const filtered = prev.filter((r) => r.id !== run.id);
    // Insertar el nuevo al frente
    localStorage.setItem(HISTORY_KEY, JSON.stringify([run, ...filtered]));
  };

  /** Devuelve el último resultado guardado, o null si no hay ninguno */
  const getLastRun = (): RunResult | null => {
    const raw = localStorage.getItem(LAST_RUN_KEY);
    return raw ? (JSON.parse(raw) as RunResult) : null;
  };

  /** Devuelve el historial completo de resultados (más reciente primero) */
  const getHistory = (): RunResult[] => {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as RunResult[]) : [];
  };

  /** Limpia todo el historial y el último run */
  const clearHistory = (): void => {
    localStorage.removeItem(LAST_RUN_KEY);
    localStorage.removeItem(HISTORY_KEY);
  };

  return { saveRun, getLastRun, getHistory, clearHistory };
}
