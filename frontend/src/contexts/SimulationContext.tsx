import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";

// --- Helpers ---
const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

const randDelta = (range: number) =>
  (Math.random() * 2 - 1) * range;

const API = "http://localhost:3000/api";

/** Maps the URL slug used in /simulation/:slug → scenario UUID in the DB (seed data) */
export const SCENARIO_IDS: Record<string, string> = {
  "kidney-uturing":    "33333333-3333-3333-3333-333333333333",
  "liver-resection":   "44444444-4444-4444-4444-444444444444",
  "prostatectomy":     "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  "gastric-bypass":    "ffffffff-ffff-ffff-ffff-ffffffffffff",
  "colon-anastomosis": "12121212-1212-1212-1212-121212121212",
  "esophagectomy":     "34343434-3434-3434-3434-343434343434",
};

// --- Public types ---
export interface VitalSigns {
  fc: string;   // heart rate (bpm)
  spo2: string; // oxygen saturation (%)
  temp: string; // temperature (°C)
}

export interface RunResult {
  id: string;
  fecha: string;
  duracion: number;
  puntaje: number;
  signosVitales: VitalSigns;
  cirujano: string;
}

interface SimulationState {
  // Timer
  elapsedSeconds: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  resetTimer: () => void;
  skipForward: () => void;

  // View tools
  activeViewTool: string;
  setActiveViewTool: (tool: string) => void;
  resetView: () => void;
  viewResetCounter: number;

  // Instruments
  activeInstrument: string;
  setActiveInstrument: (id: string) => void;

  // Vital signs
  vitalSigns: VitalSigns;

  // DB integration
  /** UUID of the active run in the DB, null if not yet started */
  runId: string | null;
  /** Creates a run in the DB when the first Play is pressed */
  dbStartRun: (slug: string) => Promise<void>;
  /** Saves result config then marks the run as COMPLETED in the DB */
  dbFinishRun: (puntaje: number, vitals: VitalSigns) => Promise<void>;
}

const SimulationContext = createContext<SimulationState | null>(null);

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be inside SimulationProvider");
  return ctx;
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeViewTool, setActiveViewTool] = useState("move");
  const [activeInstrument, setActiveInstrument] = useState("scalpel");
  const [viewResetCounter, setViewResetCounter] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // DB run tracking
  const [runId, setRunId] = useState<string | null>(null);

  const dbStartRun = useCallback(async (slug: string) => {
    if (runId) return; // already started
    const scenarioId = SCENARIO_IDS[slug];
    if (!scenarioId) {
      console.warn(`[SimulationContext] Unknown slug: ${slug}`);
      return;
    }
    try {
      const res = await fetch(`${API}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scenarioId }),
      });
      if (res.ok) {
        const data = await res.json();
        setRunId(data.id);
        console.log(`[SimulationContext] Run started in DB: ${data.id}`);
      } else {
        console.error("[SimulationContext] dbStartRun failed:", await res.text());
      }
    } catch (e) {
      console.error("[SimulationContext] dbStartRun network error:", e);
    }
  }, [runId]);

  const dbFinishRun = useCallback(async (puntaje: number, vitals: VitalSigns) => {
    if (!runId) {
      console.warn("[SimulationContext] dbFinishRun called but no runId — run was never started in DB");
      return;
    }
    try {
      // 1. Persist the result data (puntaje + vitals) in the run's config field
      const configRes = await fetch(`${API}/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ config: { puntaje, signosVitales: vitals } }),
      });
      if (!configRes.ok) {
        console.error("[SimulationContext] dbFinishRun: config save failed:", await configRes.text());
        // Still proceed — run should be completed even if config save fails
      }
      // 2. Mark the run as COMPLETED (auto-computes run_metric_summary)
      const res = await fetch(`${API}/runs/${runId}/finish`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        console.log(`[SimulationContext] Run ${runId} finished in DB`);
      } else {
        console.error("[SimulationContext] dbFinishRun failed:", await res.text());
      }
    } catch (e) {
      console.error("[SimulationContext] dbFinishRun network error:", e);
    }
  }, [runId]);

  // Vital signs state — start at baseline values
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    fc: "72",
    spo2: "98",
    temp: "36.5",
  });

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        // Advance timer
        setElapsedSeconds((s) => s + 1);
        // Random walk for each vital sign
        setVitalSigns((prev) => {
          const fc = clamp(Math.round(Number(prev.fc) + randDelta(2)), 55, 110);
          const spo2 = clamp(Math.round(Number(prev.spo2) + randDelta(1)), 90, 100);
          const rawTemp = parseFloat((Number(prev.temp) + randDelta(0.1)).toFixed(1));
          const temp = clamp(rawTemp, 35.0, 38.5);
          return {
            fc: String(fc),
            spo2: String(spo2),
            temp: temp.toFixed(1),
          };
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  const resetTimer = useCallback(() => {
    setIsPlaying(false);
    setElapsedSeconds(0);
    setVitalSigns({ fc: "72", spo2: "98", temp: "36.5" });
    setRunId(null); // allow a fresh run to be created on next play
  }, []);
  const skipForward = useCallback(() => setElapsedSeconds((s) => s + 30), []);
  const resetView = useCallback(() => setViewResetCounter((c) => c + 1), []);

  return (
    <SimulationContext.Provider
      value={{
        elapsedSeconds,
        isPlaying,
        play,
        pause,
        togglePlay,
        resetTimer,
        skipForward,
        activeViewTool,
        setActiveViewTool,
        resetView,
        viewResetCounter,
        activeInstrument,
        setActiveInstrument,
        vitalSigns,
        runId,
        dbStartRun,
        dbFinishRun,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}
