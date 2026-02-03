import { getGameDay } from './resetLogic'

/**
 * Calculate consecutive streak for daily tasks
 */
export function calculateDailyStreak(completionHistory, currentDate, taskCreatedAt) {
  if (!completionHistory || completionHistory.length === 0) return 0
  
  let streak = 0
  const currentGameDay = getGameDay(currentDate.toISOString())
  const today = new Date(currentGameDay)
  
  // Check if date is completed
  const isDateCompleted = (date) => {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    const gameDayToCheck = checkDate.toISOString()
    return completionHistory.some(completionGameDay => completionGameDay === gameDayToCheck)
  }
  
  const todayCompleted = isDateCompleted(today)
  
  let checkDate = new Date(today)
  if (!todayCompleted) {
    checkDate.setDate(checkDate.getDate() - 1)
  }
  
  while (checkDate >= new Date(taskCreatedAt)) {
    if (isDateCompleted(checkDate)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}

/**
 * Calculate consecutive streak for weekly tasks
 */
export function calculateWeeklyStreak(completionHistory, getWeeksForDisplay) {
  if (!completionHistory || completionHistory.length === 0) return 0
  
  const weeks = getWeeksForDisplay()
  let streak = 0
  
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].completed) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}
