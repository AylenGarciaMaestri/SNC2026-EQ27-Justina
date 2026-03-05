import { Activity, Heart, Thermometer, Timer } from "lucide-react";
import { useParams } from "react-router-dom";
import { useSimulation } from "../../contexts/SimulationContext";
import { getOrganBySlug } from "../../lib/organData";

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const DEFAULT_VITALS = { fc: "78", spo2: "97", temp: "36.5" };

export function VitalStats() {
  const { elapsedSeconds } = useSimulation();
  const { organ } = useParams<{ organ: string }>();

  const vitals = (organ ? getOrganBySlug(organ)?.vitals : undefined) ?? DEFAULT_VITALS;

  // Cambiamos las clases personalizadas por colores estándar de Tailwind con efecto "Glow"
  const stats = [
    { 
      icon: Heart, 
      label: "FC", 
      value: vitals.fc, 
      unit: "bpm", 
      color: "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]",
      animate: "animate-pulse" // El corazón late
    },
    { 
      icon: Activity, 
      label: "SpO₂", 
      value: vitals.spo2, 
      unit: "%", 
      color: "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]",
      animate: ""
    },
    { 
      icon: Thermometer, 
      label: "Temp", 
      value: vitals.temp, 
      unit: "°C", 
      color: "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
      animate: ""
    },
    { 
      icon: Timer, 
      label: "Tiempo", 
      value: formatTime(elapsedSeconds), 
      unit: "min", 
      color: "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]",
      animate: ""
    },
  ];

  return (
    // Contenedor principal: Fondo oscuro, desenfoque y borde sutil
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/70 shadow-2xl rounded-xl p-4 flex flex-col gap-4 w-48 select-none">
      
      {/* Cabecera del monitor */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          Monitor Vital
        </span>
        {/* Indicador de "En vivo" (Puntito verde parpadeante) */}
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      </div>

      {/* Lista de signos vitales */}
      <div className="flex flex-col gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3">
            
            {/* Contenedor del icono con fondo oscuro */}
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/50 flex items-center justify-center">
              <stat.icon className={`w-4 h-4 ${stat.color} ${stat.animate}`} />
            </div>
            
            {/* Valores y etiquetas */}
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">
                {stat.label}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-xl font-bold text-slate-100 leading-none tracking-tight">
                  {stat.value}
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                  {stat.unit}
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}