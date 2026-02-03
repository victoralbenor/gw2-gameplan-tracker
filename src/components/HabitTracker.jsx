import './HabitTracker.css'
import { getGameDay } from '../utils/resetLogic'
import { calculateDailyStreak, calculateWeeklyStreak } from '../utils/streakCalculator'

function HabitTracker({ task, resetType, debugMode, isExpanded, onToggleExpand }) {
  if (resetType === 'none') return null

  const completionHistory = task.completionHistory || []
  
  // Get current date
  let currentDate
  if (debugMode && debugMode.useFakeTime) {
    currentDate = new Date(debugMode.fakeTime)
  } else {
    currentDate = new Date()
  }

  // Get last 7 days
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate)
      date.setDate(date.getDate() - i)
      days.push(date)
    }
    return days
  }

  // Get current month days
  const getCurrentMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const days = []
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }
    return days
  }

  // Check if a date was completed
  const isDateCompleted = (date) => {
    // Normalize the date to game day (midnight)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    const gameDayToCheck = checkDate.toISOString()
    
    return completionHistory.some(completionGameDay => {
      // completionHistory now stores game days (already normalized ISO strings)
      return completionGameDay === gameDayToCheck
    })
  }

  // Check if date is in the future
  const isFuture = (date) => {
    return date > currentDate
  }
  
  const getWeeksForDisplay = () => {
    const weeks = []
    const now = new Date(currentDate)
    
    // Generate last 8 weeks
    for (let i = 0; i < 8; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - (i * 7))
      
      // Find the Monday that started this week (considering 04:30 reset)
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
      const UTC_MINUS_3_OFFSET = -3 * 60
      const utcMinus3 = new Date(utc + (UTC_MINUS_3_OFFSET * 60000))
      
      const dayOfWeek = utcMinus3.getDay()
      const hourOfDay = utcMinus3.getHours()
      const minuteOfDay = utcMinus3.getMinutes()
      
      let daysSinceWeekStart
      if (dayOfWeek === 1 && (hourOfDay < 4 || (hourOfDay === 4 && minuteOfDay < 30))) {
        daysSinceWeekStart = 7
      } else if (dayOfWeek === 0) {
        daysSinceWeekStart = 6
      } else {
        daysSinceWeekStart = dayOfWeek - 1
      }
      
      const weekStart = new Date(utcMinus3)
      weekStart.setDate(weekStart.getDate() - daysSinceWeekStart)
      weekStart.setHours(0, 0, 0, 0)
      
      const weekStartStr = weekStart.toISOString()
      
      // Check if any day in this week is completed
      const completed = completionHistory?.some(gameDay => gameDay === weekStartStr) || false
      
      // Format: "Feb week of Monday 2"
      const monthName = weekStart.toLocaleDateString('en-US', { month: 'short' })
      const dayNum = weekStart.getDate()
      
      weeks.push({
        label: `${monthName} week of Monday ${dayNum}`,
        completed,
        isCurrent: i === 0
      })
    }
    
    return weeks.reverse()
  }

  const last7Days = getLast7Days()
  const monthDays = getCurrentMonthDays()
  
  // Calculate streak using utility functions
  const currentStreak = resetType === 'weekly'
    ? calculateWeeklyStreak(completionHistory, getWeeksForDisplay)
    : calculateDailyStreak(completionHistory, currentDate, task.createdAt)
  
  const streakUnit = resetType === 'weekly' ? (currentStreak === 1 ? 'week' : 'weeks') : (currentStreak === 1 ? 'day' : 'days')

  // Weekly view
  if (resetType === 'weekly') {
    const weeks = getWeeksForDisplay()
    
    return (
      <div className="habit-tracker-wrapper">
        {currentStreak > 0 && (
          <div className="streak-counter" title={`${currentStreak} ${streakUnit} streak`}>
            🔥 {currentStreak}
          </div>
        )}
        
        <button 
          className="expand-btn"
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          title={isExpanded ? 'Hide history' : 'Show history'}
        >
          {isExpanded ? '▼' : '📊'}
        </button>

        {isExpanded && (
          <div className="habit-expanded weekly-view">
            <h4>Weekly History</h4>
            <div className="weekly-history">
              {weeks.map((week, i) => (
                <div
                  key={i}
                  className={`week-item ${
                    week.completed ? 'completed' : ''
                  } ${
                    week.isCurrent ? 'current' : ''
                  }`}
                >
                  {week.label}
                </div>
              ))}
            </div>
            
            <div className="habit-stats">
              <div className="stat">
                <span className="stat-value">{completionHistory.length}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat">
                <span className="stat-value">{currentStreak}</span>
                <span className="stat-label">Streak</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Daily view
  return (
    <div className="habit-tracker-wrapper">
      {currentStreak > 0 && (
        <div className="streak-counter" title={`${currentStreak} ${streakUnit} streak`}>
          🔥 {currentStreak}
        </div>
      )}
      
      <button 
        className="expand-btn"
        onClick={(e) => {
          e.stopPropagation()
          onToggleExpand()
        }}
        title={isExpanded ? 'Hide history' : 'Show history'}
      >
        {isExpanded ? '▼' : '📊'}
      </button>

      {isExpanded && (
        <div className="habit-expanded">
          <h4>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
          <div className="weekday-labels">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>
          <div className="month-grid">
            {/* Add empty cells for days before month starts */}
            {Array.from({ length: monthDays[0].getDay() === 0 ? 6 : monthDays[0].getDay() - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="day-cell empty"></div>
            ))}
            
            {monthDays.map((date, index) => {
              const completed = isDateCompleted(date)
              const future = isFuture(date)
              
              // Compare using game day logic
              const currentGameDay = getGameDay(currentDate.toISOString())
              const dateGameDay = new Date(date)
              dateGameDay.setHours(0, 0, 0, 0)
              const isToday = dateGameDay.toISOString() === currentGameDay
              
              return (
                <div
                  key={index}
                  className={`day-cell ${completed ? 'completed' : ''} ${future ? 'future' : ''} ${isToday ? 'today' : ''}`}
                  title={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                >
                  {date.getDate()}
                </div>
              )
            })}
          </div>
          
          <div className="habit-stats">
            <div className="stat">
              <span className="stat-value">{completionHistory.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat">
              <span className="stat-value">{currentStreak}</span>
              <span className="stat-label">Streak</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HabitTracker
