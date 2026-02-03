// Timezone offset for UTC-3
const UTC_MINUS_3_OFFSET = -3 * 60 // -180 minutes

// Convert a timestamp to the "game day" (day it counts for, considering 21:00 reset)
export function getGameDay(timestamp) {
  const date = new Date(timestamp)
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
  const utcMinus3 = new Date(utc + (UTC_MINUS_3_OFFSET * 60000))
  
  // If it's 21:00 or later, it counts for the next day
  if (utcMinus3.getHours() >= 21) {
    utcMinus3.setDate(utcMinus3.getDate() + 1)
  }
  
  // Set to midnight to just get the date
  utcMinus3.setHours(0, 0, 0, 0)
  return utcMinus3.toISOString()
}

// Get all days in the current game week (Monday 04:30 to Monday 04:30)
export function getGameWeekDays(timestamp) {
  const date = new Date(timestamp)
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
  const utcMinus3 = new Date(utc + (UTC_MINUS_3_OFFSET * 60000))
  
  // Find the Monday 04:30 that started this week
  const dayOfWeek = utcMinus3.getDay() // 0 = Sunday, 1 = Monday
  const hourOfDay = utcMinus3.getHours()
  const minuteOfDay = utcMinus3.getMinutes()
  
  // Calculate days since last Monday 04:30
  let daysSinceWeekStart
  if (dayOfWeek === 1 && (hourOfDay < 4 || (hourOfDay === 4 && minuteOfDay < 30))) {
    // It's Monday before 04:30, so week started last Monday
    daysSinceWeekStart = 7
  } else if (dayOfWeek === 0) {
    // Sunday, week started 6 days ago
    daysSinceWeekStart = 6
  } else {
    // Other days
    daysSinceWeekStart = dayOfWeek - 1
  }
  
  const weekStart = new Date(utcMinus3)
  weekStart.setDate(weekStart.getDate() - daysSinceWeekStart)
  weekStart.setHours(0, 0, 0, 0)
  
  // Get all 7 days of the week
  const days = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + i)
    days.push(day.toISOString())
  }
  
  return days
}

// Get current time in UTC-3
function getCurrentTimeUTCMinus3(debugMode = null) {
  let now
  
  if (debugMode && debugMode.useFakeTime) {
    now = new Date(debugMode.fakeTime)
  } else {
    now = new Date()
  }
  
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const utcMinus3 = new Date(utc + (UTC_MINUS_3_OFFSET * 60000))
  return utcMinus3
}

// Check if daily reset has occurred (21:00 UTC-3)
function shouldResetDaily(lastResetTime, debugMode = null) {
  if (!lastResetTime) return true

  const lastReset = new Date(lastResetTime)
  const now = getCurrentTimeUTCMinus3(debugMode)
  
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
function shouldResetWeekly(lastResetTime, debugMode = null) {
  if (!lastResetTime) return true

  const lastReset = new Date(lastResetTime)
  const now = getCurrentTimeUTCMinus3(debugMode)
  
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
function resetCategoryTasks(category, debugMode = null) {
  const { resetType, lastResetTime, tasks } = category
  
  let shouldReset = false
  
  if (resetType === 'daily') {
    shouldReset = shouldResetDaily(lastResetTime, debugMode)
  } else if (resetType === 'weekly') {
    shouldReset = shouldResetWeekly(lastResetTime, debugMode)
  }
  
  if (shouldReset) {
    // When resetting, we need to check each task's completion history
    // Only uncheck if the task was NOT completed for the current game day
    let currentTime
    if (debugMode && debugMode.useFakeTime) {
      currentTime = debugMode.fakeTime
    } else {
      currentTime = new Date().toISOString()
    }
    
    const currentGameDay = getGameDay(currentTime)
    
    return {
      ...category,
      tasks: tasks.map(task => {
        const completionHistory = task.completionHistory || []
        // Check if current game day is in the completion history
        const completedToday = completionHistory.some(gameDay => gameDay === currentGameDay)
        
        return {
          ...task,
          completed: completedToday, // Keep checked if completed for current game day
          completionHistory
        }
      }),
      lastResetTime: new Date().toISOString()
    }
  }
  
  return category
}

// Check and reset all categories
export function checkAndResetTasks(categories, debugMode = null) {
  const resetCategories = {}
  
  for (const [key, category] of Object.entries(categories)) {
    resetCategories[key] = resetCategoryTasks(category, debugMode)
  }
  
  return resetCategories
}
