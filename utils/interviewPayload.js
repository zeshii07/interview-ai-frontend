/**
 * Small helpers for connecting interviewStore/session.js to the upgraded API.
 */

export function getRecentQuestionTexts(questions, limit = 8) {
  if (!Array.isArray(questions)) return [];

  return questions
    .map((item) =>
      typeof item === "string"
        ? item.trim()
        : String(item?.question || "").trim()
    )
    .filter(Boolean)
    .slice(-limit);
}

export function normalizeGeneratedQuestion(response) {
  const payload = response?.data || response;

  if (!payload?.question) {
    throw new Error("The server returned an invalid interview question.");
  }

  return {
    question: String(payload.question).trim(),
    category: ["technical", "behavioral", "situational"].includes(
      String(payload.category || "").toLowerCase()
    )
      ? String(payload.category).toLowerCase()
      : "technical",
    difficulty: String(payload.difficulty || "").toLowerCase(),
    tips: Array.isArray(payload.tips) ? payload.tips : [],
    what_interviewer_wants:
      payload.what_interviewer_wants || "",
    time_suggested: Number(payload.time_suggested) || 90,
    language: payload.language || "English",
  };
}

export function normalizeEvaluation(response) {
  const payload = response?.data || response;

  if (!payload || typeof payload !== "object") {
    throw new Error("The server returned an invalid evaluation.");
  }

  return {
    ...payload,
    rating: Number(payload.rating) || 0,
    rating_max: Number(payload.rating_max) || 10,
    structure_score: Number(payload.structure_score) || 0,
    content_score: Number(payload.content_score) || 0,
    communication_score:
      Number(payload.communication_score) || 0,
    strengths: Array.isArray(payload.strengths)
      ? payload.strengths
      : [],
    improvements: Array.isArray(payload.improvements)
      ? payload.improvements
      : [],
  };
}
