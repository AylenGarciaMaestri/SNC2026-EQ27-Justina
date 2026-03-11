import { useState } from "react";
import { Settings, Save, Play, Pause, RotateCcw, LayoutDashboard, Flag, CheckCircle, BarChart } from "lucide-react";
import { useSimulation } from "../../contexts/SimulationContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useNavigate, useLocation } from "react-router-dom";

// Asegúrate de que las rutas a las imágenes sean correctas
import kidneyImg from "../../assets/surgical/organ-kidney.png";
import liverImg from "../../assets/surgical/organ-liver.png";
import gastricImg from "../../assets/surgical/organ-gastric.jpg";
import esophagectomyImg from "../../assets/surgical/organ-esophagus.jpg"; 

const simulations = [
  { id: "kidney", label: "Kidney Suturing", image: kidneyImg, path: "/simulation/kidney-uturing" },
  { id: "liver", label: "Liver Resection", image: liverImg, path: "/simulation/liver-resection" },
  { id: "gastric", label: "Gastric Bypass", image: gastricImg, path: "/simulation/gastric-bypass" },
  { id: "esophagectomy", label: "Esophagectomy", image: esophagectomyImg, path: "/simulation/esophagectomy" },
];

function formatTime(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hrs > 0
    ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`;
}

export function TopToolbar() {
  const { isPlaying, togglePlay, resetTimer, elapsedSeconds, vitalSigns, runId, dbStartRun, dbFinishRun } = useSimulation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 🛡️ NUEVA MEMORIA: Rastrea si ya guardamos los datos de esta partida
  const [hasSavedThisSession, setHasSavedThisSession] = useState(false);

  const btnStyle = "flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-cyan-400 hover:border-cyan-500/50 transition-all";

  // Función envuelta para reiniciar también la memoria de guardado
  const handleResetSimulation = () => {
    resetTimer(); // also resets runId in context
    setHasSavedThisSession(false);
    setIsSaving(false);
  };

  /**
   * Primer Play → crea el Run en la BD.
   * Pausas/reanudaciones posteriores solo hacen togglePlay.
   */
  const handleTogglePlay = async () => {
    if (!runId && !isPlaying) {
      const slug = location.pathname.split('/simulation/')[1] ?? "";
      await dbStartRun(slug);
    }
    togglePlay();
  };

  const handleFinishSimulation = async () => {
    // 1. Siempre pausamos el tiempo al darle a finalizar
    if (isPlaying) {
      togglePlay();
    }

    // 2. 🛡️ CANDADO LÓGICO: Si ya guardamos, solo mostramos el modal y NO creamos datos nuevos.
    if (hasSavedThisSession) {
      setShowFinishModal(true);
      return;
    }

    // 3. Si es la primera vez que finalizan esta partida, guardamos los datos:
    const currentSim = simulations.find(sim => sim.path === location.pathname);
    
    const uniqueSessionId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const procedureId = location.pathname.split('/simulation/')[1] ?? "unknown";
    const puntaje = Math.floor(Math.random() * (99 - 65 + 1)) + 65;
    const sigVitales = { fc: vitalSigns.fc, spo2: vitalSigns.spo2, temp: vitalSigns.temp };

    // --- Guardar en la BD ---
    setIsSaving(true);
    await dbFinishRun(puntaje, sigVitales);
    setIsSaving(false);

    // --- Guardar en localStorage (backup para label/imagen en Results) ---
    const newResult = {
      sessionId: uniqueSessionId,
      id: procedureId,
      label: currentSim ? currentSim.label : "Simulación Desconocida",
      image: currentSim ? currentSim.image : "",
      fecha: new Date().toISOString(),
      duracion: elapsedSeconds,
      puntaje,
      signosVitales: sigVitales,
      cirujano: localStorage.getItem("auth_user_name") ?? "Dr. Invitado",
    };

    const existingHistory = JSON.parse(localStorage.getItem('simulation_results') || '[]');
    const updatedHistory = [newResult, ...existingHistory];
    localStorage.setItem('simulation_results', JSON.stringify(updatedHistory));

    // 4. Marcamos la partida como guardada y mostramos el pop-up
    setHasSavedThisSession(true);
    setShowFinishModal(true);
  };

  return (
    <>
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/70 shadow-2xl rounded-xl px-5 py-3 flex items-center justify-between select-none">
        
        {/* IZQUIERDA: Info de Simulación */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">
            <div 
              className={`w-2 h-2 rounded-full transition-colors ${
                isPlaying 
                  ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
                  : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              }`} 
            />
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-300 font-semibold">
              {isPlaying ? "En curso" : "Pausado"}
            </span>
          </div>
          
          <div className="h-5 w-px bg-slate-700" />
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              T. Qx
            </span>
            <span className="font-mono text-lg font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* CENTRO: Controles */}
        <div className="flex items-center gap-2 bg-slate-800/40 p-1 rounded-xl border border-slate-700/30">
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Actualizado para usar la nueva función de reset */}
              <button onClick={handleResetSimulation} className={btnStyle} disabled={showFinishModal || isSaving}>
                <RotateCcw className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="glass-panel border-white/5">Reiniciar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleTogglePlay} 
                disabled={showFinishModal || isSaving}
                className={`flex items-center justify-center w-11 h-11 rounded-lg transition-all ${
                  isPlaying 
                    ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
                    : "bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600"
                } ${showFinishModal ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
              </button>
            </TooltipTrigger>
            <TooltipContent className="glass-panel border-white/5">
              {isPlaying ? "Pausar Simulación" : "Iniciar Simulación"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* DERECHA: Acciones */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className={btnStyle} disabled={showFinishModal}>
                  <Save className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="glass-panel border-white/5">Guardar Progreso</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button className={btnStyle} disabled={showFinishModal}>
                  <Settings className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="glass-panel border-white/5">Ajustes</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-5 w-px bg-slate-700 mx-1" />

          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-lg transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-bold">Panel</span>
          </button>

          <button 
            onClick={handleFinishSimulation}
            disabled={showFinishModal || isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all 
              ${showFinishModal || isSaving
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
          >
            <Flag className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-bold">
              {isSaving ? "Guardando..." : "Finalizar"}
            </span>
          </button>
        </div>
      </div>

      {/* MODAL DE ÉXITO */}
      {showFinishModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-8 max-w-sm w-full flex flex-col items-center text-center mx-4 animate-in zoom-in-95 duration-300">
            
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">¡Simulación Exitosa!</h2>
            <p className="text-slate-400 text-sm mb-6">
              El procedimiento ha sido registrado. Los datos de la intervención están listos para su análisis en el historial.
            </p>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl w-full py-4 mb-8">
              <span className="block text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Tiempo Total</span>
              <span className="font-mono text-3xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            <button 
              onClick={() => navigate('/results')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)] hover:shadow-[0_0_25px_rgba(8,145,178,0.6)] active:scale-[0.98]"
            >
              <BarChart className="w-5 h-5" />
              <span>Ver Historial de Resultados</span>
            </button>

            <button 
              onClick={() => setShowFinishModal(false)}
              className="mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors font-medium"
            >
              Volver a la simulación
            </button>
          </div>
        </div>
      )}
    </>
  );
}