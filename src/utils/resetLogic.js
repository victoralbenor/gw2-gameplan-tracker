// Timezone offset for UTC-3
const UTC_MINUS_3_OFFSET = -3 * 60 // -180 minutes

// Get current time in UTC-3
function getCurrentTimeUTCMinus3() {
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const utcMinus3 = new Date(utc + (UTC_MINUS_3_OFFSET * 60000))
  return utcMinus3
}

// Check if daily reset has occurred (21:00 UTC-3)
function shouldResetDaily(lastResetTime) {
  if (!lastResetTime) return true

  const lastReset = new Date(lastResetTime)
  const now = getCurrentTimeUTCMinus3()
  
  // Today's reset time at 21:00 UTC-3
  const todayReset = new Date(now)
  todayReset.setHours(21, 0, 0, 0)
  
  // Yesterday's reset time at 21:00 UTC-3
  const yesterdayReset = new Date(todayReset)
  yesterdayReset.setDate(yesterdayReset.getDate() - 1)
  
  // If current time is past 21:00 today and last reset was before today's reset
  if (now >= todayReset && lastReset < todayReset) {
    return true
  }
  
  // If current time is before 21:00 today and last reset was before yesterday's reset
  if (now < todayReset && lastReset < yesterdayReset) {
    return true
  }
  
  return false
}

// Check if weekly reset has occurred (Monday at 04:30 UTC-3)
function shouldResetWeekly(lastResetTime) {
  if (!lastResetTime) return true

  const lastReset = new Date(lastResetTime)
  const now = getCurrentTimeUTCMinus3()
  
  // Find the most recent Monday at 04:30 UTC-3
  const currentWeekReset = new Date(now)
  const dayOfWeek = currentWeekReset.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Days since last Monday
  
  currentWeekReset.setDate(currentWeekReset.getDate() - daysToSubtract)
  currentWeekReset.setHours(4, 30, 0, 0)
  
  // If we haven't reached this week's reset yet, use last week's reset
  if (now < currentWeekReset) {
    currentWeekReset.setDate(currentWeekReset.getDate() - 7)
  }
  
  // Reset if last reset was before the most recent Monday 04:30
  return lastReset < currentWeekReset
}

// Reset tasks for a category if needed
function resetCategoryTasks(category) {
  const { resetType, lastResetTime, tasks } = category
  
  let shouldReset = false
  
  if (resetType === 'daily') {
    shouldReset = shouldResetDaily(lastResetTime)
  } else if (resetType === 'weekly') {
    shouldReset = shouldResetWeekly(lastResetTime)
  }
  
  if (shouldReset) {
    return {
      ...category,
      tasks: tasks.map(task => ({ ...task, completed: false })),
      lastResetTime: new Date().toISOString()
    }
  }
  
  return category
}

// Check and reset all categories
export function checkAndResetTasks(categories) {
  const resetCategories = {}
  
  for (const [key, category] of Object.entries(categories)) {
    resetCategories[key] = resetCategoryTasks(category)
  }
  
  return resetCategories
}
