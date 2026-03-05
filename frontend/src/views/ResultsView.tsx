import { useNavigate } from 'react-router-dom';
import { Heart, Activity, Thermometer, Clock, Trophy, User, Calendar, LayoutDashboard } from 'lucide-react';
import Navbar from '../components/Navbar/Navbar';
import { useRunHistory } from '../hooks/useRunHistory';
import { ORGAN_DATA } from '../lib/organData';
import type { RunResult } from '../lib/organData';

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0
    ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ScoreBar({ puntaje }: { puntaje: number }) {
  const color =
    puntaje >= 90 ? 'bg-emerald-500' :
    puntaje >= 75 ? 'bg-cyan-500' :
    'bg-amber-500';

  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5">
      <div
        className={`${color} h-2.5 rounded-full transition-all duration-700`}
        style={{ width: `${puntaje}%` }}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black text-gray-900">
          {value} <span className="text-sm font-medium text-gray-400">{unit}</span>
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Trophy className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-500 mb-2">No hay resultados aún</h2>
      <p className="text-gray-400 mb-6 text-sm">Completa una simulación para ver tus resultados aquí.</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all"
      >
        <LayoutDashboard className="w-4 h-4" />
        Ir al Dashboard
      </button>
    </div>
  );
}

function RunCard({ run }: { run: RunResult }) {
  const navigate = useNavigate();
  const organ = ORGAN_DATA[run.id];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-800 to-slate-700 px-8 py-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Procedimiento</p>
          <h2 className="text-2xl font-black text-white">{organ?.label ?? run.id}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Puntaje</p>
          <p className="text-4xl font-black text-cyan-400">{run.puntaje}<span className="text-lg text-slate-400">%</span></p>
        </div>
      </div>

      {/* Score bar */}
      <div className="px-8 py-3 bg-slate-50 border-b border-gray-100">
        <ScoreBar puntaje={run.puntaje} />
      </div>

      {/* Meta info */}
      <div className="px-8 py-5 grid grid-cols-2 gap-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Cirujano</p>
            <p className="text-sm font-bold text-gray-800">{run.cirujano}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Fecha</p>
            <p className="text-sm font-bold text-gray-800">{formatDate(run.fecha)}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Clock}        label="Duración"   value={formatDuration(run.duracion)} unit="min"  color="text-blue-500" />
        <StatCard icon={Heart}        label="Frec. Card." value={run.signosVitales.fc}          unit="bpm"  color="text-rose-500" />
        <StatCard icon={Activity}     label="SpO₂"        value={run.signosVitales.spo2}         unit="%"    color="text-cyan-500" />
        <StatCard icon={Thermometer}  label="Temperatura" value={run.signosVitales.temp}         unit="°C"   color="text-amber-500" />
      </div>

      {/* Actions */}
      <div className="px-8 pb-8 flex gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => navigate(`/simulation/${organ?.slug ?? run.id}`)}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:border-cyan-400 hover:text-cyan-600 text-gray-600 font-bold rounded-xl transition-all"
        >
          Repetir simulación
        </button>
      </div>
    </div>
  );
}

const ResultsView = () => {
  const { getHistory, getLastRun } = useRunHistory();
  const history = getHistory();
  const lastRun = getLastRun();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full p-4 sm:p-6 max-w-7xl mx-auto">
        <Navbar />
      </header>
      <main className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resultados</h1>
        <p className="text-gray-400 mb-8 text-sm">
          {history.length > 0
            ? `${history.length} procedimiento${history.length > 1 ? 's' : ''} completado${history.length > 1 ? 's' : ''}`
            : 'Completa una simulación para ver tus resultados aquí.'}
        </p>

        {history.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-8">
            {history.map((run) => (
              <div key={run.id} className="relative">
                {/* Badge "Último" solo en el run más reciente */}
                {run.id === lastRun?.id && (
                  <span className="absolute -top-3 left-6 z-10 bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
                    Último
                  </span>
                )}
                <RunCard run={run} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ResultsView;
