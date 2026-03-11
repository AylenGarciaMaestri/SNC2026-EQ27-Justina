import { query } from "../config/db.js";

export const getRunEvents = async (runId) => {
  const queryText = `
    SELECT id, run_id, event_type, event_time, payload, severity
    FROM run_events
    WHERE run_id = $1
    ORDER BY event_time ASC
  `;

  const { rows } = await query(queryText, [runId]);
  return rows;
};
