import * as runRepository from "../repositories/runsRepository.js";
import * as runEventRepository from "../repositories/runsEventRepository.js";
import * as scenarioRepository from "../repositories/scenarioRepository.js";
import * as runMetricSummaryRepository from "../repositories/runsMetricSummaryRepository.js";

export const computeAndSaveSummary = async (runId) => {
  const run = await runRepository.getRunById(runId);
  const events = await runEventRepository.getRunEvents(runId);
  const scenario = await scenarioRepository.getScenarioById(run.scenario_id);

  const totalTime =
    Math.round((new Date(run.ended_at) - new Date(run.started_at)) / 1000);

  const errorsTotal = events.filter(
    e => ["error", "critical"].includes(e.severity)
  ).length;

  const criticalErrors = events.filter(
    e => e.severity === "critical"
  ).length;

  // Guard: avoid division by zero or NaN if totalTime is 0 or expectedTime is missing
  const expectedTime = scenario?.expected_time_seconds ?? 0;
  const safeTotalTime = totalTime > 0 ? totalTime : 1;
  const timeScore = expectedTime > 0 ? expectedTime / safeTotalTime : 1;

  const penalty = errorsTotal * 0.05;

  // Cap score to 1.0 (can't exceed perfect) and floor at 0
  const finalScore = Math.min(1.0, Math.max(0, timeScore - penalty));

  await runMetricSummaryRepository.createRunMetricSummary({
    runId,
    totalTime: safeTotalTime,
    errorsTotal,
    criticalErrors,
    score: finalScore
  });

  return { runId, totalTime: safeTotalTime, errorsTotal, criticalErrors, score: finalScore };
};

export const getRunSummary = async (runId) => {
  return await runMetricSummaryRepository.getRunMetricSummary(runId);

};

// validaciones que no tenga usuario que no tenga escenario, que el run exista, etc.