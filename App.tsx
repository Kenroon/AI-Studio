
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Routine, WorkoutSession, AppState, MuscleGroup, Exercise, ExerciseLog, SetLog, BodyWeightLog, AppSettings } from './types';
import { MUSCLE_GROUPS } from './constants';
import { loadState, saveState, exportToCSV } from './utils/storage';
import { SimpleChart } from './components/SimpleChart';

const ACCENT_COLORS = [
  { name: 'Bosque', color: '#1B4332' },
  { name: 'Apple', color: '#34C759' },
  { name: 'Azul', color: '#007AFF' },
  { name: 'Índigo', color: '#5856D6' },
  { name: 'Naranja', color: '#FF9500' },
  { name: 'Rojo', color: '#FF3B30' },
  { name: 'Púrpura', color: '#AF52DE' },
  { name: 'Teal', color: '#5AC8FA' }
];

const PATTERNS: { id: string; name: string; svg: string }[] = [
  { id: 'none', name: 'Liso', svg: '' },
  { id: 'plate', name: 'Disco', svg: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='45' fill='black'/%3E%3Ccircle cx='50' cy='50' r='10' fill='white'/%3E%3C/svg%3E")` },
  { id: 'dumbbell', name: 'Mancuerna', svg: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='10' y='42' width='80' height='16' fill='black'/%3E%3Crect x='10' y='25' width='20' height='50' rx='2' fill='black'/%3E%3Crect x='70' y='25' width='20' height='50' rx='2' fill='black'/%3E%3C/svg%3E")` },
  { id: 'kettlebell', name: 'Kettlebell', svg: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 5c-15 0-25 10-25 25v10h50V30c0-15-10-25-25-25zm-15 25c0-8 7-15 15-15s15 7 15 15v10H35V30z' fill='black'/%3E%3Ccircle cx='50' cy='65' r='30' fill='black'/%3E%3C/svg%3E")` },
  { id: 'flex', name: 'Fuerza', svg: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 50c0-15 10-25 25-25h10v15H45c-8 0-10 5-10 10v30H20V50zm45-25h10c15 0 25 10 25 25v30H80V50c0-5-2-10-10-10H65V25z' fill='black'/%3E%3Crect x='42' y='10' width='16' height='80' fill='black'/%3E%3C/svg%3E")` }
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadState());
  const [activeTab, setActiveTab] = useState('routines');
  
  // Modales & Navegación
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [exerciseDetailTab, setExerciseDetailTab] = useState<'entrenar' | 'historial' | 'progreso'>('entrenar');
  const [viewingRoutine, setViewingRoutine] = useState<Routine | null>(null);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  
  // Estados de navegación interna (Agrupación Visual)
  const [libraryMuscleGroup, setLibraryMuscleGroup] = useState<MuscleGroup | null>(null);
  const [editRoutineMuscleGroup, setEditRoutineMuscleGroup] = useState<MuscleGroup | null>(null);

  // Otros estados
  const [weightInput, setWeightInput] = useState<string>('');
  const [showReminder, setShowReminder] = useState(false);
  const [isLibraryEditMode, setIsLibraryEditMode] = useState(false);
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({ muscleGroup: MuscleGroup.CHEST });

  // Estilos
  const isDark = state.settings.theme === 'dark';
  const accent = state.settings.accentColor;

  // --- GESTIÓN DE NAVEGACIÓN ANDROID (BACK BUTTON) ---
  const closeTopmostModal = useCallback(() => {
    if (selectedExerciseId) setSelectedExerciseId(null);
    else if (exerciseDetailTab !== 'entrenar' && viewingRoutine) setExerciseDetailTab('entrenar');
    else if (libraryMuscleGroup) setLibraryMuscleGroup(null);
    else if (editRoutineMuscleGroup) setEditRoutineMuscleGroup(null);
    else if (viewingRoutine) setViewingRoutine(null);
    else if (editingRoutine) setEditingRoutine(null);
    else if (isAddingExercise) setIsAddingExercise(false);
    else if (showWeightForm) setShowWeightForm(false);
  }, [selectedExerciseId, viewingRoutine, editingRoutine, isAddingExercise, showWeightForm, libraryMuscleGroup, editRoutineMuscleGroup, exerciseDetailTab]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const isAnyModalOpen = selectedExerciseId || viewingRoutine || editingRoutine || isAddingExercise || showWeightForm || libraryMuscleGroup || editRoutineMuscleGroup;
      if (isAnyModalOpen) closeTopmostModal();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedExerciseId, viewingRoutine, editingRoutine, isAddingExercise, showWeightForm, libraryMuscleGroup, editRoutineMuscleGroup, closeTopmostModal]);

  useEffect(() => {
    const isAnyModalOpen = selectedExerciseId || viewingRoutine || editingRoutine || isAddingExercise || showWeightForm || libraryMuscleGroup || editRoutineMuscleGroup;
    if (isAnyModalOpen) window.history.pushState({ modal: true }, '');
  }, [selectedExerciseId !== null, viewingRoutine !== null, editingRoutine !== null, isAddingExercise, showWeightForm, libraryMuscleGroup !== null, editRoutineMuscleGroup !== null]);

  const manualClose = (setter: (val: any) => void, val: any) => {
    setter(val);
    if (window.history.state?.modal) window.history.back();
  };
  // --- FIN GESTIÓN NAVEGACIÓN ---

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    if (state.bodyWeightLogs.length === 0) { setShowReminder(true); return; }
    const lastLog = state.bodyWeightLogs[state.bodyWeightLogs.length - 1];
    if (Date.now() - lastLog.timestamp > 14 * 24 * 60 * 60 * 1000) setShowReminder(true);
  }, [state.bodyWeightLogs]);

  const handleSaveRoutine = (routine: Routine) => {
    setState(prev => {
      const exists = prev.routines.find(r => r.id === routine.id);
      if (exists) return { ...prev, routines: prev.routines.map(r => r.id === routine.id ? routine : r) };
      return { ...prev, routines: [...prev.routines, routine] };
    });
    manualClose(setEditingRoutine, null);
    setEditRoutineMuscleGroup(null);
  };

  const deleteRoutine = (id: string) => {
    if (!confirm('¿Eliminar rutina?')) return;
    setState(prev => ({ ...prev, routines: prev.routines.filter(r => r.id !== id) }));
  };

  const handleAddExercise = () => {
    if (!newExercise.name || !newExercise.muscleGroup) return;
    const exercise: Exercise = { id: Date.now().toString(), name: newExercise.name, muscleGroup: newExercise.muscleGroup as MuscleGroup };
    setState(prev => ({ ...prev, customExercises: [...prev.customExercises, exercise] }));
    manualClose(setIsAddingExercise, false);
    setNewExercise({ muscleGroup: MuscleGroup.CHEST });
  };

  const deleteExercise = (id: string) => {
    if (!confirm('¿Eliminar ejercicio de toda la app?')) return;
    setState(prev => ({
      ...prev,
      customExercises: prev.customExercises.filter(e => e.id !== id),
      routines: prev.routines.map(r => ({ ...r, exerciseIds: r.exerciseIds.filter(exId => exId !== id) }))
    }));
  };

  const reorderExercise = (id: string, direction: 'up' | 'down') => {
    setState(prev => {
      const index = prev.customExercises.findIndex(e => e.id === id);
      const newExercises = [...prev.customExercises];
      if (direction === 'up' && index > 0) [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
      else if (direction === 'down' && index < newExercises.length - 1) [newExercises[index + 1], newExercises[index]] = [newExercises[index], newExercises[index + 1]];
      return { ...prev, customExercises: newExercises };
    });
  };

  const getOrCreateTodaySession = (routineName: string): WorkoutSession => {
    const today = new Date().toLocaleDateString();
    const existing = state.sessions.find(s => s.date === today && s.routineId === routineName);
    if (existing) return existing;
    return { id: Date.now().toString(), date: today, timestamp: Date.now(), routineId: routineName, logs: [] };
  };

  const updateSessionWithLog = (routineName: string, exerciseId: string, sets: SetLog[]) => {
    const session = getOrCreateTodaySession(routineName);
    const logIndex = session.logs.findIndex(l => l.exerciseId === exerciseId);
    const newLogs = [...session.logs];
    if (logIndex >= 0) newLogs[logIndex] = { ...newLogs[logIndex], sets };
    else newLogs.push({ exerciseId, sets });
    const updatedSession = { ...session, logs: newLogs };
    setState(prev => {
      const others = prev.sessions.filter(s => s.id !== session.id);
      return { ...prev, sessions: [...others, updatedSession] };
    });
  };

  const addSetToToday = (routineName: string, exerciseId: string) => {
    const session = getOrCreateTodaySession(routineName);
    const log = session.logs.find(l => l.exerciseId === exerciseId);
    const newSets = [...(log?.sets || []), { reps: 0, weight: 0, note: '' }];
    updateSessionWithLog(routineName, exerciseId, newSets);
  };

  const updateSetInToday = (routineName: string, exerciseId: string, setIndex: number, field: keyof SetLog, value: any) => {
    const session = getOrCreateTodaySession(routineName);
    const log = session.logs.find(l => l.exerciseId === exerciseId);
    if (!log) return;
    const newSets = log.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s);
    updateSessionWithLog(routineName, exerciseId, newSets);
  };

  const removeSetFromToday = (routineName: string, exerciseId: string, setIndex: number) => {
    const session = getOrCreateTodaySession(routineName);
    const log = session.logs.find(l => l.exerciseId === exerciseId);
    if (!log) return;
    updateSessionWithLog(routineName, exerciseId, log.sets.filter((_, i) => i !== setIndex));
  };

  const handleUpdateSetting = (field: keyof AppSettings, value: any) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, [field]: value } }));
  };

  const handleAddWeight = () => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return;
    const newLog: BodyWeightLog = { id: Date.now().toString(), date: new Date().toLocaleDateString(), timestamp: Date.now(), weight: val };
    setState(prev => ({ ...prev, bodyWeightLogs: [...prev.bodyWeightLogs, newLog] }));
    setWeightInput('');
    manualClose(setShowWeightForm, false);
    setShowReminder(false);
  };

  const exerciseHistory = (exId: string) => state.sessions.map(s => ({ date: s.date, log: s.logs.find(l => l.exerciseId === exId) })).filter(i => i.log && i.log.sets.length > 0);
  const getVolumeData = (exId: string) => {
    const data = state.sessions.map(s => {
      const log = s.logs.find(l => l.exerciseId === exId);
      if (!log || log.sets.length === 0) return null;
      return { label: s.date, value: log.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0) };
    }).filter((d): d is { label: string; value: number } => d !== null);
    const grouped = data.reduce((acc, curr) => {
      const ex = acc.find(a => a.label === curr.label);
      if (ex) ex.value += curr.value; else acc.push({ ...curr });
      return acc;
    }, [] as { label: string; value: number }[]);
    return grouped.sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());
  };

  const currentPatternRaw = PATTERNS.find(p => p.id === state.settings.bgPattern)?.svg || '';
  const currentPattern = isDark 
    ? currentPatternRaw.replace(/fill='black'/g, "fill='white'").replace(/fill='white'/g, "fill='black'").replace(/stroke='black'/g, "stroke='white'")
    : currentPatternRaw;

  // Componente de Grupo Muscular (Card) rediseñado con sutiles toques de color
  const MuscleGroupCard: React.FC<{ mg: MuscleGroup; onClick: () => void; selected?: boolean }> = ({ mg, onClick, selected }) => (
    <div 
      onClick={onClick}
      className={`p-6 rounded-[2rem] aspect-square flex flex-col items-center justify-center space-y-3 transition-all active:scale-95 cursor-pointer border-2 shadow-sm ${selected ? 'text-white' : (isDark ? 'bg-gray-800/40 border-gray-700/30' : 'bg-white border-transparent')}`}
      style={{ 
        backgroundColor: selected ? accent : (isDark ? undefined : accent + '08'), 
        borderColor: selected ? accent : (isDark ? undefined : accent + '15'),
        boxShadow: selected ? `0 10px 25px -5px ${accent}44` : undefined
      }}
    >
      <div 
        className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl transition-colors ${selected ? 'bg-white text-black' : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-white shadow-sm')}`}
        style={{ color: !selected ? accent : undefined }}
      >
        {mg.charAt(0)}
      </div>
      <span className={`font-black uppercase text-[10px] tracking-widest ${selected ? 'text-white' : 'opacity-80'}`} style={{ color: !selected ? (isDark ? '#fff' : '#000') : undefined }}>
        {mg}
      </span>
    </div>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} settings={state.settings}>
      <div className="pb-10 min-h-[80vh]">
        {activeTab === 'routines' && (
          <div className="animate-in space-y-6 relative h-full">
            <div className={`fixed inset-0 pointer-events-none flex items-center justify-center ${isDark ? 'opacity-[0.08]' : 'opacity-[0.04]'}`}>
              <div className="w-full h-full max-w-[300px] max-h-[300px] bg-center bg-no-repeat bg-contain" style={{ backgroundImage: currentPattern }}></div>
            </div>
            <header className="flex justify-between items-end relative z-10">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tus Planes</p>
                <h1 className="text-4xl font-bold">Rutinas</h1>
              </div>
              <button onClick={() => setEditingRoutine({ id: Date.now().toString(), name: '', exerciseIds: [] })} className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md active:scale-90 transition-transform" style={{ color: accent }}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
            </header>
            <div className="space-y-4 relative z-10">
              {state.routines.map(r => (
                <div key={r.id} className={`p-6 rounded-[2.5rem] shadow-sm flex justify-between items-center group cursor-pointer border-2 transition-all active:scale-[0.98] ${isDark ? 'bg-gray-800/80 backdrop-blur border-transparent hover:border-gray-600' : 'bg-white/80 backdrop-blur border-transparent hover:border-gray-100'}`} onClick={() => setViewingRoutine(r)}>
                  <div><h3 className="text-xl font-bold">{r.name}</h3><p className="text-xs font-black text-gray-400 uppercase tracking-wider">{r.exerciseIds.length} Ejercicios</p></div>
                  <div className="flex space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); setEditingRoutine(r); }} className="p-2 text-gray-400 hover:text-blue-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteRoutine(r.id); }} className="p-2 text-gray-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="animate-in space-y-8">
            <header className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{libraryMuscleGroup ? `Librería > ${libraryMuscleGroup}` : 'Biblioteca Personal'}</p>
                <h1 className="text-4xl font-bold">{libraryMuscleGroup ? libraryMuscleGroup : 'Músculos'}</h1>
              </div>
              <div className="flex space-x-2">
                {libraryMuscleGroup && <button onClick={() => setLibraryMuscleGroup(null)} className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md text-gray-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>}
                <button onClick={() => setIsAddingExercise(true)} className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-md" style={{ color: accent }}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
                <button onClick={() => setIsLibraryEditMode(!isLibraryEditMode)} className={`p-3 rounded-full shadow-md transition-all ${isLibraryEditMode ? 'text-white' : 'bg-white dark:bg-gray-800 text-gray-400'}`} style={{ backgroundColor: isLibraryEditMode ? accent : undefined }}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>
              </div>
            </header>

            {!libraryMuscleGroup ? (
              <div className="grid grid-cols-2 gap-4 animate-in">
                {MUSCLE_GROUPS.map(mg => (
                  <MuscleGroupCard key={mg} mg={mg} onClick={() => setLibraryMuscleGroup(mg)} />
                ))}
              </div>
            ) : (
              <div className="animate-in space-y-2">
                <div className={`rounded-[2.5rem] overflow-hidden shadow-sm border ${isDark ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-50'}`}>
                  {state.customExercises.filter(e => e.muscleGroup === libraryMuscleGroup).map((e, idx, arr) => (
                    <div key={e.id} onClick={() => { if(!isLibraryEditMode) { setSelectedExerciseId(e.id); setExerciseDetailTab('entrenar'); } }} className={`p-6 flex justify-between items-center transition-colors ${!isLibraryEditMode && 'cursor-pointer hover:bg-gray-100/10'} ${idx !== arr.length - 1 ? (isDark ? 'border-b border-gray-700' : 'border-b border-gray-50') : ''}`}>
                      <span className="font-bold opacity-80">{e.name}</span>
                      {isLibraryEditMode ? (
                        <div className="flex space-x-1" onClick={(ev) => ev.stopPropagation()}>
                          <button onClick={() => reorderExercise(e.id, 'up')} className="p-2 text-gray-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                          <button onClick={() => reorderExercise(e.id, 'down')} className="p-2 text-gray-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                          <button onClick={() => deleteExercise(e.id)} className="p-2 text-red-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      ) : (
                        <div className="p-2 rounded-full" style={{ backgroundColor: accent + '10', color: accent }}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {state.customExercises.filter(e => e.muscleGroup === libraryMuscleGroup).length === 0 && (
                    <div className="p-10 text-center text-gray-400 italic font-medium">No hay ejercicios en este grupo.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'weight' && (
          <div className="animate-in space-y-8">
            <header className="flex justify-between items-end"><h1 className="text-4xl font-bold">Tu Peso</h1><button onClick={() => setShowWeightForm(true)} className="p-3 rounded-full shadow-lg text-white" style={{ backgroundColor: accent }}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" /></svg></button></header>
            <section className={`p-6 rounded-[2.5rem] shadow-sm border ${isDark ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-50'}`}><SimpleChart data={state.bodyWeightLogs.map(l => ({ label: l.date, value: l.weight }))} color={accent} /></section>
            <div className="space-y-4">{state.bodyWeightLogs.slice().reverse().map(l => (<div key={l.id} className={`p-5 rounded-[1.5rem] flex justify-between items-center shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}><span className="text-gray-400 text-xs font-bold uppercase">{l.date}</span><span className="text-xl font-black">{l.weight}KG</span></div>))}</div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in space-y-6">
            <header className="flex justify-between items-end"><h1 className="text-4xl font-bold">Actividad</h1><button onClick={() => exportToCSV(state.sessions, state.bodyWeightLogs, state.customExercises)} className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">Exportar</button></header>
            <div className="space-y-4">{state.sessions.slice().sort((a,b) => b.timestamp - a.timestamp).map(s => (
              <div key={s.id} className={`p-6 rounded-[2.5rem] shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-50'}`}><div className="flex justify-between mb-4"><h3 className="font-bold">{s.routineId}</h3><span className="text-[10px] font-black text-gray-400 uppercase">{s.date}</span></div><div className="space-y-2">{s.logs.filter(l => l.sets.length > 0).map(l => (<div key={l.exerciseId} className="flex justify-between text-xs"><span className="text-gray-400">{state.customExercises.find(e => e.id === l.exerciseId)?.name}</span><span className="font-bold" style={{ color: accent }}>{l.sets.length} series</span></div>))}</div></div>
            ))}</div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-in space-y-10">
            <header><h1 className="text-4xl font-bold">Ajustes</h1></header>
            <section className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase ml-4">Apariencia</h3>
              <div className={`p-6 rounded-[2.5rem] shadow-sm border space-y-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-50'}`}>
                <div className="flex justify-between items-center"><span className="font-bold">Modo Oscuro</span><button onClick={() => handleUpdateSetting('theme', isDark ? 'light' : 'dark')} className={`w-14 h-8 rounded-full transition-colors relative ${isDark ? 'bg-apple-green' : 'bg-gray-300'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isDark ? 'left-7' : 'left-1'}`}></div></button></div>
                <div className="space-y-3"><span className="text-xs font-bold text-gray-400">Color de Acento</span><div className="grid grid-cols-4 gap-3">{ACCENT_COLORS.map(c => (<button key={c.name} onClick={() => handleUpdateSetting('accentColor', c.color)} className={`h-12 rounded-2xl border-2 transition-all ${state.settings.accentColor === c.color ? 'border-gray-400 scale-105 shadow-md' : 'border-transparent opacity-60'}`} style={{ backgroundColor: c.color }}></button>))}</div></div>
                <div className="space-y-3"><span className="text-xs font-bold text-gray-400">Fondo Central</span><div className="grid grid-cols-2 gap-2">{PATTERNS.map(p => (<button key={p.id} onClick={() => handleUpdateSetting('bgPattern', p.id)} className={`py-3 rounded-2xl text-[10px] font-black uppercase border-2 transition-all overflow-hidden relative ${state.settings.bgPattern === p.id ? 'border-gray-400 bg-gray-100 dark:bg-gray-700' : 'border-transparent bg-gray-50 dark:bg-gray-900 opacity-60'}`}><div className="absolute inset-0 opacity-10 pointer-events-none scale-50 bg-center bg-no-repeat bg-contain" style={{ backgroundImage: p.id === 'none' ? '' : (isDark ? p.svg.replace(/black/g, 'white') : p.svg) }}></div><span className="relative z-10">{p.name}</span></button>))}</div></div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Detalle Rutina - Con padding seguro */}
      {viewingRoutine && (
        <div className={`fixed inset-0 z-[60] p-6 overflow-y-auto animate-in safe-top ${isDark ? 'bg-[#1c1c1e]' : 'bg-[#f2f2f7]'}`}>
          <div className="flex justify-between items-center mb-10 pt-4"><button onClick={() => manualClose(setViewingRoutine, null)} className={`font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button><h2 className="text-lg font-black uppercase text-gray-300 truncate px-4">{viewingRoutine.name}</h2><div className="w-10"></div></div>
          <div className="space-y-4">{viewingRoutine.exerciseIds.map(id => {
            const ex = state.customExercises.find(e => e.id === id);
            return (<div key={id} onClick={() => { setSelectedExerciseId(id); setExerciseDetailTab('entrenar'); }} className={`p-6 rounded-[2rem] flex justify-between items-center cursor-pointer shadow-sm active:scale-95 transition-all ${isDark ? 'bg-gray-800' : 'bg-white'}`}><span className="font-bold">{ex?.name}</span><div className="p-2 rounded-full" style={{ backgroundColor: accent + '22', color: accent }}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></div></div>);
          })}</div>
        </div>
      )}

      {/* Detalle Ejercicio Modal - Con padding seguro */}
      {selectedExerciseId && (
        <div className={`fixed inset-0 z-[80] p-6 overflow-y-auto animate-in flex flex-col safe-top ${isDark ? 'bg-[#1c1c1e]' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-6 pt-4"><button onClick={() => manualClose(setSelectedExerciseId, null)} className={`font-bold w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button><h2 className="text-lg font-black uppercase tracking-widest text-gray-300">Detalles</h2><div className="w-10"></div></div>
          <header className="mb-6"><h1 className="text-3xl font-bold leading-tight">{state.customExercises.find(e => e.id === selectedExerciseId)?.name}</h1></header>
          <div className={`flex p-1 rounded-2xl mb-8 ${isDark ? 'bg-gray-800' : 'bg-[#f2f2f7]'}`}>
            {viewingRoutine && (<button onClick={() => setExerciseDetailTab('entrenar')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${exerciseDetailTab === 'entrenar' ? 'text-white shadow-lg' : 'text-gray-400 opacity-60'}`} style={{ backgroundColor: exerciseDetailTab === 'entrenar' ? accent : undefined }}>Entrenar</button>)}
            <button onClick={() => setExerciseDetailTab('historial')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${exerciseDetailTab === 'historial' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-800 shadow-sm') : 'text-gray-400 opacity-60'}`}>Historial</button>
            <button onClick={() => setExerciseDetailTab('progreso')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${exerciseDetailTab === 'progreso' ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-800 shadow-sm') : 'text-gray-400 opacity-60'}`}>Progreso</button>
          </div>
          <div className="flex-1">
            {exerciseDetailTab === 'entrenar' && viewingRoutine && (
              <div className="space-y-6 pb-20">
                <div className="flex justify-between items-center"><h3 className="text-xs font-black text-gray-400 uppercase">Sesión de Hoy</h3><button onClick={() => addSetToToday(viewingRoutine.name, selectedExerciseId)} className={`font-black text-[10px] uppercase px-4 py-2 rounded-full border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-green-50 border-green-100'}`} style={{ color: accent }}>+ Añadir Serie</button></div>
                <div className="space-y-4">
                  {(getOrCreateTodaySession(viewingRoutine.name).logs.find(l => l.exerciseId === selectedExerciseId)?.sets || []).map((set, idx) => (
                    <div key={idx} className={`p-5 rounded-[2rem] space-y-4 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#f2f2f7] border-gray-100'}`}>
                      <div className="flex items-center space-x-4"><span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-inner ${isDark ? 'bg-gray-700 text-gray-500' : 'bg-white text-gray-300'}`}>{idx+1}</span>
                        <div className="flex-1 flex space-x-6">
                          <div className="flex-1"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">KG</p><input type="number" value={set.weight || ''} onChange={e => updateSetInToday(viewingRoutine.name, selectedExerciseId, idx, 'weight', parseFloat(e.target.value) || 0)} className="w-full bg-transparent font-black text-xl outline-none" placeholder="0" /></div>
                          <div className="flex-1 border-l border-gray-700 pl-6"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Reps</p><input type="number" value={set.reps || ''} onChange={e => updateSetInToday(viewingRoutine.name, selectedExerciseId, idx, 'reps', parseInt(e.target.value) || 0)} className="w-full bg-transparent font-black text-xl outline-none" placeholder="0" /></div>
                        </div>
                        <button onClick={() => removeSetFromToday(viewingRoutine.name, selectedExerciseId, idx)} className="text-gray-500 p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                      <div className={`p-3 rounded-2xl ${isDark ? 'bg-gray-900/50' : 'bg-white/60'}`}><input type="text" value={set.note || ''} onChange={e => updateSetInToday(viewingRoutine.name, selectedExerciseId, idx, 'note', e.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none" placeholder="Añadir nota..." /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {exerciseDetailTab === 'historial' && (
              <div className="space-y-6 pb-20">{exerciseHistory(selectedExerciseId).slice().reverse().map((h, i) => (<div key={i} className={`p-5 rounded-[2rem] ${isDark ? 'bg-gray-800' : 'bg-[#f2f2f7]'}`}><div className="flex justify-between mb-3 items-center"><span className="text-[10px] font-black text-gray-400 uppercase">{h.date}</span></div><div className="space-y-2">{h.log?.sets.map((s, idx) => (<div key={idx} className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-white/60'}`}><div className="flex justify-between text-sm font-bold opacity-80"><span>Serie {idx+1}</span><span>{s.weight}kg x {s.reps}</span></div>{s.note && <p className="text-[10px] text-gray-400 mt-1 italic">"{s.note}"</p>}</div>))}</div></div>))}</div>
            )}
            {exerciseDetailTab === 'progreso' && (<div className="space-y-6 pb-20"><section className={`p-6 rounded-[3rem] shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-cream border-[#f5f1d7]'}`}><SimpleChart data={getVolumeData(selectedExerciseId)} color={accent} /></section></div>)}
          </div>
        </div>
      )}

      {/* Modal Editar Rutina - Con padding seguro */}
      {editingRoutine && (
        <div className={`fixed inset-0 z-[70] p-6 overflow-y-auto animate-in safe-top ${isDark ? 'bg-[#1c1c1e]' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-10 pt-4"><button onClick={() => { manualClose(setEditingRoutine, null); setEditRoutineMuscleGroup(null); }} className="text-gray-400 font-bold">Cancelar</button><button onClick={() => handleSaveRoutine(editingRoutine)} className="font-black bg-green-50 dark:bg-green-900/20 px-5 py-2 rounded-full" style={{ color: accent }}>Guardar</button></div>
          <input type="text" value={editingRoutine.name} onChange={e => setEditingRoutine({...editingRoutine, name: e.target.value})} placeholder="Nombre de Rutina" className={`w-full text-4xl font-bold mb-10 focus:outline-none border-b pb-4 ${isDark ? 'bg-transparent border-gray-800' : 'bg-transparent border-gray-50'}`} />
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{editRoutineMuscleGroup ? `Añadiendo: ${editRoutineMuscleGroup}` : 'Selecciona Músculo'}</h4>
              {editRoutineMuscleGroup && <button onClick={() => setEditRoutineMuscleGroup(null)} className="text-[10px] font-black uppercase opacity-50">Volver</button>}
            </div>

            {!editRoutineMuscleGroup ? (
              <div className="grid grid-cols-2 gap-3 pb-20">
                {MUSCLE_GROUPS.map(mg => (
                  <MuscleGroupCard key={mg} mg={mg} onClick={() => setEditRoutineMuscleGroup(mg)} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 pb-20 animate-in">
                {state.customExercises.filter(e => e.muscleGroup === editRoutineMuscleGroup).map(e => (
                  <div key={e.id} onClick={() => { const ids = editingRoutine.exerciseIds.includes(e.id) ? editingRoutine.exerciseIds.filter(i => i !== e.id) : [...editingRoutine.exerciseIds, e.id]; setEditingRoutine({...editingRoutine, exerciseIds: ids}); }} className={`p-5 rounded-[1.8rem] flex justify-between items-center transition-all border-2 ${editingRoutine.exerciseIds.includes(e.id) ? 'bg-green-50 dark:bg-green-900/10' : (isDark ? 'bg-gray-800 border-transparent' : 'bg-[#f2f2f7] border-transparent')}`} style={{ borderColor: editingRoutine.exerciseIds.includes(e.id) ? accent : 'transparent' }}>
                    <span className="text-sm font-bold opacity-80">{e.name}</span>
                    {editingRoutine.exerciseIds.includes(e.id) && <div className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: accent }}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Añadir Ejercicio */}
      {isAddingExercise && (
        <div className="fixed inset-0 z-[100] apple-blur flex items-center justify-center p-6 animate-in">
          <div className={`w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="text-xl font-bold">Añadir Ejercicio</h3>
            <input type="text" value={newExercise.name || ''} onChange={e => setNewExercise({...newExercise, name: e.target.value})} placeholder="Nombre (ej: Press Hammer)" className={`w-full rounded-2xl p-4 font-bold outline-none ${isDark ? 'bg-gray-900' : 'bg-[#f2f2f7]'}`} />
            <select value={newExercise.muscleGroup} onChange={e => setNewExercise({...newExercise, muscleGroup: e.target.value as MuscleGroup})} className={`w-full rounded-2xl p-4 font-bold outline-none ${isDark ? 'bg-gray-900' : 'bg-[#f2f2f7]'}`}>
              {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg}</option>)}
            </select>
            <div className="flex space-x-3"><button onClick={() => manualClose(setIsAddingExercise, false)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 rounded-2xl font-bold text-gray-400">Cancelar</button><button onClick={handleAddExercise} className="flex-1 py-4 text-white rounded-2xl font-bold" style={{ backgroundColor: accent }}>Añadir</button></div>
          </div>
        </div>
      )}

      {/* Recordatorios y Formulario de Peso */}
      {showReminder && (
        <button onClick={() => { setShowWeightForm(true); setShowReminder(false); }} className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center animate-bounce text-white border-4 border-white dark:border-gray-800" style={{ backgroundColor: accent }}><svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg></button>
      )}

      {showWeightForm && (
        <div className="fixed inset-0 z-[100] apple-blur flex items-center justify-center p-6 animate-in">
          <div className={`w-full max-sm rounded-[3.5rem] p-8 shadow-2xl space-y-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="text-2xl font-bold text-center">Registrar Peso</h3>
            <div className="relative"><input type="number" step="0.1" autoFocus value={weightInput} onChange={e => setWeightInput(e.target.value)} className={`w-full rounded-[2rem] p-8 text-5xl font-black text-center outline-none ${isDark ? 'bg-gray-900' : 'bg-[#f2f2f7]'}`} placeholder="0.0" /><span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-gray-300">KG</span></div>
            <div className="flex space-x-3"><button onClick={() => manualClose(setShowWeightForm, false)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 rounded-2xl font-bold text-gray-400">Cerrar</button><button onClick={handleAddWeight} className="flex-1 py-4 text-white rounded-2xl font-bold shadow-lg shadow-green-100" style={{ backgroundColor: accent }}>Guardar</button></div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
