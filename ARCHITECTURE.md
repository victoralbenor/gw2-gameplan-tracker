# GW2 Gameplan Tracker - Architecture

## Project Structure

```
src/
├── components/
│   ├── TaskCategory.jsx      (243 lines) - Category container with task list
│   ├── HabitTracker.jsx       (210 lines) - Streak counter & history view
│   ├── DebugPanel.jsx         (131 lines) - Testing tools for reset logic
│   └── *.css                            - Component-scoped styles
├── utils/
│   ├── resetLogic.js          (189 lines) - Game day & reset calculations
│   ├── completionHistory.js    (56 lines) - Daily/weekly completion logic
│   ├── dateHelpers.js         (109 lines) - Date formatting & countdown
│   └── streakCalculator.js     (53 lines) - Streak calculation logic
├── App.jsx                    (168 lines) - Main app orchestrator
└── main.jsx                              - React entry point
```

## Core Concepts

### Game Day Logic
GW2's daily reset happens at **21:00 UTC-3** (Buenos Aires time). Any task completed ≥21:00 counts for the *next* calendar day.

- `getGameDay(timestamp)` - Converts real timestamp to game day
- `getGameWeekDays(timestamp)` - Gets all 7 days in current game week

### Reset Types
1. **Daily** - Reset at 21:00 UTC-3
2. **Weekly** - Reset Monday 04:30 UTC-3  
3. **None** - No reset (permanent goals)

### Data Flow

```
User Action (toggle task)
    ↓
App.jsx (toggleTask)
    ↓
completionHistory.js (add/remove completion)
    ↓
localStorage (persist)
    ↓
TaskCategory → HabitTracker (display)
    ↓
streakCalculator.js (calculate consecutive days/weeks)
```

## Key Files

### `App.jsx`
**Purpose:** State management & orchestration  
**Responsibilities:**
- Manages 4 category states (coffeeWeeklies, coffeeDailies, gamingDailies, workingGoals)
- CRUD operations (add, toggle, delete, edit, reorder tasks)
- Debug mode state
- LocalStorage persistence
- Auto-reset check (60-second interval)

**Key Functions:**
- `toggleTask()` - Handles completion with daily vs weekly logic
- `checkAndResetTasks()` - Runs reset logic every minute

---

### `utils/resetLogic.js`
**Purpose:** Core reset & game day calculations  
**Exports:**
- `getGameDay(timestamp)` - Convert to game day (accounts for 21:00 offset)
- `getGameWeekDays(timestamp)` - Get all days in current game week
- `checkAndResetTasks(categories, debugMode)` - Check if reset needed & execute

**Critical Logic:**
- Tasks reset based on `lastResetTime` crossing reset threshold
- Daily: checks if 21:00 UTC-3 passed
- Weekly: checks if Monday 04:30 UTC-3 passed
- `resetCategoryTasks()` preserves current game day completions

---

### `utils/completionHistory.js` ⭐ NEW
**Purpose:** Centralized completion add/remove logic  
**Why:** Separated daily vs weekly completion logic from App.jsx

**Exports:**
- `addDailyCompletion()` - Add single game day
- `removeDailyCompletion()` - Remove single game day
- `addWeeklyCompletion()` - Add entire week (7 days)
- `removeWeeklyCompletion()` - Remove entire week
- `toggleCompletion()` - Universal toggle (routes to daily/weekly)

**Usage:**
```js
const updated = toggleCompletion(history, timestamp, 'weekly', true)
// Returns new array with entire week added
```

---

### `utils/dateHelpers.js` ⭐ NEW  
**Purpose:** Date formatting & countdown calculations  
**Why:** Extracted from TaskCategory.jsx for reusability

**Exports:**
- `getTimeUntilReset(resetType, debugMode)` - "2h 15m" until next reset
- `formatTimestamp(isoString, debugMode)` - "5m ago, Monday 03/Feb/2026 at 14:30"

**Handles:**
- UTC-3 timezone conversion
- Debug mode fake time
- Relative time formatting

---

### `utils/streakCalculator.js` ⭐ NEW
**Purpose:** Streak calculation logic  
**Why:** Extracted from HabitTracker.jsx (was 100+ lines)

**Exports:**
- `calculateDailyStreak(history, currentDate, createdAt)` - Consecutive days
- `calculateWeeklyStreak(history, getWeeksForDisplay)` - Consecutive weeks

**Logic:**
- Counts backwards from today/this week
- Stops at first missing day/week
- Respects game day boundaries

---

### `components/HabitTracker.jsx`
**Purpose:** Display streak & completion history  
**Reduced from:** 301 → 210 lines  

**Features:**
- Inline streak counter (🔥 5 days)
- Expandable history (📊 button)
- **Daily view:** Monthly calendar with completed days highlighted
- **Weekly view:** List of weeks ("Feb week of Monday 2")

**Now uses:**
- `calculateDailyStreak()` / `calculateWeeklyStreak()` from utils
- Simpler, more focused on rendering

---

### `components/TaskCategory.jsx`
**Purpose:** Render category with task list  
**Reduced from:** 343 → 243 lines  

**Features:**
- Drag-and-drop reordering
- Inline editing (pencil button)
- "Last done" timestamps
- Completion checkbox
- Time-until-reset countdown

**Now uses:**
- `getTimeUntilReset()` / `formatTimestamp()` from utils
- No duplicate helper functions

---

## Data Model

### Task Object
```js
{
  id: 1234567890,
  text: "Complete daily fractals",
  completed: true,
  createdAt: "2026-02-03T18:00:00.000Z",
  lastCompleted: "2026-02-03T21:35:00.000Z",
  completionHistory: [
    "2026-02-04T00:00:00.000Z",  // Game day (completed at 21:35 on 3rd)
    "2026-02-05T00:00:00.000Z",
    "2026-02-06T00:00:00.000Z"
  ]
}
```

**Important:** `completionHistory` stores **game days** (normalized to midnight), not raw timestamps.

### Category Object
```js
{
  title: "Coffee Run Dailies",
  description: "Resets daily at 21:00 UTC-3",
  resetType: "daily", // or "weekly" or "none"
  tasks: [...],
  lastResetTime: "2026-02-03T21:00:00.000Z"
}
```

---

## Refactoring Benefits

### Before Refactor
- ❌ `App.jsx`: 263 lines, complex toggleTask function
- ❌ `TaskCategory.jsx`: 343 lines with duplicate helpers
- ❌ `HabitTracker.jsx`: 301 lines doing calculations + rendering
- ❌ Scattered date/time utilities

### After Refactor  
- ✅ `App.jsx`: 168 lines (-36%), cleaner toggleTask
- ✅ `TaskCategory.jsx`: 243 lines (-29%), no duplicates
- ✅ `HabitTracker.jsx`: 210 lines (-30%), focused on UI
- ✅ **3 new utility modules** with clear responsibilities
- ✅ Easier to test (pure functions)
- ✅ Clear imports show dependencies

---

## Testing Strategy

### Manual Testing
Use **Debug Panel** (bottom of app):
1. Toggle "Use Fake Time"
2. Set time to test edge cases:
   - 20:59 (before daily reset)
   - 21:01 (after daily reset)
   - Monday 04:29 (before weekly reset)
   - Monday 04:31 (after weekly reset)
3. Complete tasks, advance time, verify reset behavior

### Unit Testing (Future)
```js
// completionHistory.js is now testable!
test('weekly completion adds 7 days', () => {
  const result = addWeeklyCompletion([], '2026-02-03T12:00:00.000Z')
  expect(result).toHaveLength(7)
})

// streakCalculator.js
test('daily streak counts consecutive days', () => {
  const history = ['2026-02-01', '2026-02-02', '2026-02-03']
  expect(calculateDailyStreak(history, new Date('2026-02-03'), '2026-02-01')).toBe(3)
})
```

---

## Future Improvements

### High Priority
- [ ] Extract custom hooks from App.jsx:
  - `useTaskCategories()` - all category state + operations
  - `useDebugMode()` - debug state management
  - `useLocalStorage(key, initialValue)` - reusable storage hook

### Medium Priority
- [ ] Split `HabitTracker.jsx` into:
  - `DailyHistoryView.jsx` (calendar)
  - `WeeklyHistoryView.jsx` (week list)
  - Keep main `HabitTracker.jsx` as coordinator
- [ ] Add PropTypes or migrate to TypeScript
- [ ] Constants file for reset types, localStorage keys

### Low Priority
- [ ] Add category customization (rename, reorder)
- [ ] Export/import data (JSON backup)
- [ ] Statistics dashboard (completion rate, longest streak)
- [ ] Notifications for upcoming resets

---

## When to Refactor Next

Consider refactoring when:
1. Adding a 5th category type
2. Any file exceeds 300 lines
3. Finding the same code in 3+ places
4. Adding user accounts / cloud sync
5. Scrolling too much to find code

**Current state:** ✅ Good - well-organized, maintainable, room to grow

---

## Working with This Codebase

### Adding a new feature
1. **Need date/time logic?** → Add to `utils/dateHelpers.js`
2. **Need completion logic?** → Add to `utils/completionHistory.js`
3. **Need game day calculations?** → Add to `utils/resetLogic.js`
4. **Need new UI component?** → Create in `components/`
5. **Need state management?** → Currently in `App.jsx` (or extract hook)

### Finding code
- **"How are tasks completed?"** → `App.jsx` toggleTask + `completionHistory.js`
- **"How are resets calculated?"** → `resetLogic.js`
- **"How are streaks calculated?"** → `streakCalculator.js`
- **"How is time formatted?"** → `dateHelpers.js`

### Common patterns
```js
// Getting current time (respects debug mode)
const currentTime = debugMode.useFakeTime ? debugMode.fakeTime : new Date().toISOString()

// Converting to game day
const gameDay = getGameDay(currentTime)

// Adding completion
const updated = toggleCompletion(history, currentTime, resetType, true)
```

---

## Conclusion

This refactor improved code organization without changing functionality:
- **30% line reduction** in main components
- **Clear separation** of business logic from UI
- **Testable utilities** with pure functions
- **Maintainable** - easy to find and modify code

The architecture is now ready to scale with new features while staying organized. 🎯
