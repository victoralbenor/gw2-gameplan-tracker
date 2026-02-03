import { getGameDay, getGameWeekDays } from './resetLogic'

/**
 * Add a completion for a daily task
 */
export function addDailyCompletion(completionHistory, timestamp) {
  const gameDay = getGameDay(timestamp)
  return [...completionHistory, gameDay]
}

/**
 * Remove a completion for a daily task
 */
export function removeDailyCompletion(completionHistory, timestamp) {
  const currentGameDay = getGameDay(timestamp)
  return completionHistory.filter(date => {
    const completionGameDay = getGameDay(date)
    return completionGameDay !== currentGameDay
  })
}

/**
 * Add a completion for a weekly task (adds entire week)
 */
export function addWeeklyCompletion(completionHistory, timestamp) {
  const weekDays = getGameWeekDays(timestamp)
  const uniqueDays = new Set([...completionHistory, ...weekDays])
  return Array.from(uniqueDays)
}

/**
 * Remove a completion for a weekly task (removes entire week)
 */
export function removeWeeklyCompletion(completionHistory, timestamp) {
  const weekDays = getGameWeekDays(timestamp)
  const weekDaysSet = new Set(weekDays)
  return completionHistory.filter(day => !weekDaysSet.has(day))
}

/**
 * Toggle completion for a task based on reset type
 */
export function toggleCompletion(completionHistory, timestamp, resetType, isCompleting) {
  if (resetType === 'weekly') {
    return isCompleting 
      ? addWeeklyCompletion(completionHistory, timestamp)
      : removeWeeklyCompletion(completionHistory, timestamp)
  } else {
    // Daily or any other type
    return isCompleting
      ? addDailyCompletion(completionHistory, timestamp)
      : removeDailyCompletion(completionHistory, timestamp)
  }
}
