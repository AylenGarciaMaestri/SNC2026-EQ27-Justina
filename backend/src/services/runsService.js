import { randomUUID } from 'crypto';
import * as runRepository from '../repositories/runsRepository.js';
import * as scenarioRepository from '../repositories/scenarioRepository.js';
import * as runMetricSummaryService from './runsMetricSummaryService.js';
import * as runEventRepository from '../repositories/runsEventRepository.js';

export const startRun = async (userId, scenarioId, seed, config) => {

  const scenario = await scenarioRepository.getScenarioById(scenarioId);
  if (!scenario || !scenario.is_active) {
    throw new Error('Scenario not available');
  }

  return await runRepository.createRun({
    id: randomUUID(),
    scenario_id: scenarioId,
    user_id: userId,
    status: 'IN_PROGRESS',
    started_at: new Date(),
    seed,
    config
  });
};

export const finishRun = async (runId) => {
  // Validar que runId existe y es válido
  if (!runId || typeof runId !== 'string') {
    throw new Error('Invalid runId provided');
  }

  // Verificar que el run existe antes de completarlo
  const existingRun = await runRepository.getRunById(runId);
  if (!existingRun) {
    throw new Error('Run not found');
  }

  if (existingRun.status === 'COMPLETED') {
    throw new Error('Run already completed');
  }

  const run = await runRepository.finishRun(runId);
  
  if (!run) {
    throw new Error('Failed to update run status');
  }

  // Automáticamente calcular y guardar métricas cuando se completa el run
  try {
    await runMetricSummaryService.computeAndSaveSummary(runId);
    console.log(`[RUNS] Metrics computed successfully for run ${runId}`);
  } catch (err) {
    console.error(`[RUNS] Error computing metrics for run ${runId}:`, err.message);
    // No lanzar error aquí - el run se completó, pero las métricas podrían fallar
  }

  return run;
};

export const getRunsByUser = async (userId) => {
  return await runRepository.getRunsByUser(userId);
};

export const getAll = async () => {
  return await runRepository.getAll();
};

export const getById = async (runId) => {
  return await runRepository.getRunById(runId);
};

export const updateRun = async (runId, data) => {
  return await runRepository.updateRun(runId, data);
};

export const deleteRun = async (runId) => {
  return await runRepository.deleteRun(runId);
};

/**
 * Genera un reporte completo de un run incluyendo:
 * - Información del run
 * - Información del escenario
 * - Métrica y evaluación del desempeño
 * - Eventos ocurridos
 */
export const generateReport = async (runId) => {
  // Validar runId
  if (!runId || typeof runId !== 'string') {
    throw new Error('Invalid runId provided');
  }

  const run = await runRepository.getRunById(runId);
  if (!run) {
    throw new Error('Run not found');
  }

  const scenario = await scenarioRepository.getScenarioById(run.scenario_id);
  let metrics = null;
  let events = [];

  try {
    metrics = await runMetricSummaryService.getRunSummary(runId);
  } catch (err) {
    console.error(`Error fetching metrics for run ${runId}:`, err);
  }

  try {
    events = await runEventRepository.getRunEvents(runId);
  } catch (err) {
    console.error(`Error fetching events for run ${runId}:`, err);
  }

  const report = {
    metadata: {
      generated_at: new Date().toISOString(),
      report_version: '1.0'
    },
    run: {
      id: run.id,
      scenario_id: run.scenario_id,
      user_id: run.user_id,
      status: run.status,
      started_at: run.started_at,
      ended_at: run.ended_at,
      duration_seconds: metrics?.total_time_seconds || 
        (run.ended_at ? (new Date(run.ended_at) - new Date(run.started_at)) / 1000 : null),
      seed: run.seed,
      config: run.config
    },
    scenario: {
      id: scenario?.id,
      name: scenario?.name,
      description: scenario?.description,
      expected_time_seconds: scenario?.expected_time_seconds
    },
    performance: {
      total_time_seconds: metrics?.total_time_seconds,
      expected_time_seconds: scenario?.expected_time_seconds,
      total_errors: metrics?.errors_total || 0,
      critical_errors: metrics?.critical_errors || 0,
      precision_score: metrics?.precision_score || 0,
      computed_at: metrics?.computed_at
    },
    events: {
      total_count: events.length,
      by_severity: {
        critical: events.filter(e => e.severity === 'critical').length,
        error: events.filter(e => e.severity === 'error').length,
        warning: events.filter(e => e.severity === 'warning').length,
        info: events.filter(e => e.severity === 'info').length
      },
      details: events.map(e => ({
        id: e.id,
        type: e.event_type,
        severity: e.severity,
        timestamp: e.event_time,
        details: e.payload
      }))
    },
    summary: {
      status: run.status === 'COMPLETED' ? 'completed' : 'in_progress',
      performance_rating: getPerformanceRating(metrics?.precision_score),
      recommendations: generateRecommendations(metrics, events)
    }
  };

  return report;
};

/**
 * Determina una calificación de desempeño basada en el score
 */
const getPerformanceRating = (score) => {
  if (!score) return 'no_score';
  if (score >= 0.9) return 'excellent';
  if (score >= 0.7) return 'good';
  if (score >= 0.5) return 'acceptable';
  if (score >= 0.3) return 'poor';
  return 'failed';
};

/**
 * Genera recomendaciones basadas en el desempeño
 */
const generateRecommendations = (metrics, events) => {
  const recommendations = [];

  if (!metrics) {
    recommendations.push('Métricas no disponibles para esta sesión');
    return recommendations;
  }

  if (metrics.precision_score < 0.5) {
    recommendations.push('El score de precisión es bajo. Considera revisar las técnicas y aumentar la concentración.');
  }

  if (metrics.critical_errors > 0) {
    recommendations.push(`Se detectaron ${metrics.critical_errors} errores críticos. Revisa estos eventos para mejorar la seguridad.`);
  }

  if (metrics.errors_total > 5) {
    recommendations.push('Hay muchos errores registrados. Realiza prácticas adicionales en áreas problemáticas.');
  }

  if (metrics.total_time_seconds > 0) {
    recommendations.push('Intenta optimizar tu tiempo de ejecución en futuras simulaciones.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Excelente desempeño. Continúa practicando para mantener la excelencia.');
  }

  return recommendations;
};