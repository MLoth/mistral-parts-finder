const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

/** 0-100 from good and bad ratings. Unrated is a neutral 50, and a few ratings only move it part of the way. */
export const sourceScore = (good: number, bad: number) => clamp(((good + 1) / (good + bad + 2)) * 100)

/**
 * Combines the AI's match score with the source's history.
 * A neutral source (50) leaves the score alone, a great source lifts it by up to 30%, a bad one lowers it by up to 30%.
 */
export const adjustScore = (aiScore: number, source: number) => clamp(aiScore * (0.7 + 0.006 * source))
