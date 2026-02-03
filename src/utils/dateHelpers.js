const UTC_MINUS_3_OFFSET = -3 * 60 // Buenos Aires timezone offset in minutes

/**
 * Get time remaining until next reset for a category
 */
export function getTimeUntilReset(resetType, debugMode = null) {
  if (resetType === 'none') return null

  let now
  if (debugMode && debugMode.useFakeTime) {
    now = new Date(debugMode.fakeTime)
  } else {
    now = new Date()
  }

  // Convert to UTC-3
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const utcMinus3 = new Date(utc + (UTC_MINUS_3_OFFSET * 60000))

  if (resetType === 'daily') {
    // Daily reset at 21:00 UTC-3
    const nextReset = new Date(utcMinus3)
    nextReset.setHours(21, 0, 0, 0)
    
    // If we've passed 21:00 today, reset is tomorrow
    if (utcMinus3.getHours() >= 21) {
      nextReset.setDate(nextReset.getDate() + 1)
    }
    
    const diff = nextReset - utcMinus3
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  } else if (resetType === 'weekly') {
    // Weekly reset on Monday at 04:30 UTC-3
    const nextReset = new Date(utcMinus3)
    const currentDay = nextReset.getDay() // 0 = Sunday, 1 = Monday
    const currentHour = nextReset.getHours()
    const currentMinute = nextReset.getMinutes()
    
    // Calculate days until next Monday
    let daysUntilMonday
    if (currentDay === 1 && (currentHour < 4 || (currentHour === 4 && currentMinute < 30))) {
      // It's Monday before 04:30, reset is today
      daysUntilMonday = 0
    } else if (currentDay === 0) {
      // Sunday
      daysUntilMonday = 1
    } else {
      // Tuesday-Saturday
      daysUntilMonday = (8 - currentDay) % 7
    }
    
    nextReset.setDate(nextReset.getDate() + daysUntilMonday)
    nextReset.setHours(4, 30, 0, 0)
    
    const diff = nextReset - utcMinus3
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    }
    return `${hours}h ${minutes}m`
  }

  return null
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(isoString, debugMode = null) {
  let now
  if (debugMode && debugMode.useFakeTime) {
    now = new Date(debugMode.fakeTime)
  } else {
    now = new Date()
  }

  const date = new Date(isoString)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  let relativeTime
  if (diffMins < 1) {
    relativeTime = 'just now'
  } else if (diffMins < 60) {
    relativeTime = `${diffMins}m ago`
  } else if (diffHours < 24) {
    relativeTime = `${diffHours}h ago`
  } else {
    relativeTime = `${diffDays}d ago`
  }

  // Absolute time
  const absoluteTime = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `${relativeTime} (${absoluteTime})`
}
