import { useState, useEffect, useRef } from 'react'
import './App.css'
import TaskCategory from './components/TaskCategory'
import DebugPanel from './components/DebugPanel'
import { checkAndResetTasks } from './utils/resetLogic'
import { toggleCompletion } from './utils/completionHistory'

const getInitialCategories = () => {
  const saved = localStorage.getItem('gw2-gameplan-data')
  if (saved) {
    try {
      const parsedData = JSON.parse(saved)
      // Don't auto-reset on load, let the effect handle it
      return parsedData
    } catch (e) {
      console.error('Failed to load saved data:', e)
    }
  }
  
  return {
    coffeeWeeklies: {
      title: '📅 Quick Weeklies',
      description: 'Resets Mondays at 04:30 UTC-3',
      resetType: 'weekly',
      tasks: [],
      lastResetTime: null
    },
    coffeeDailies: {
      title: '⚡ Quick Dailies',
      description: 'Resets daily at 21:00 UTC-3',
      resetType: 'daily',
      tasks: [],
      lastResetTime: null
    },
    gamingDailies: {
      title: '🎮 Gaming Dailies',
      description: 'Resets daily at 21:00 UTC-3',
      resetType: 'daily',
      tasks: [],
      lastResetTime: null
    },
    workingGoals: {
      title: '🎯 Working Goals',
      description: 'No reset - permanent progress',
      resetType: 'none',
      tasks: [],
      lastResetTime: null
    }
  }
}

function App() {
  const [categories, setCategories] = useState(getInitialCategories)
  const [debugMode, setDebugMode] = useState(() => {
    const saved = localStorage.getItem('gw2-debug-mode')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to load debug mode:', e)
      }
    }
    return {
      useFakeTime: false,
      fakeTime: new Date().toISOString()
    }
  })

  // Save debug mode to localStorage
  useEffect(() => {
    localStorage.setItem('gw2-debug-mode', JSON.stringify(debugMode))
    // Trigger reset check when debug mode changes
    setCategories(prevCategories => checkAndResetTasks(prevCategories, debugMode))
  }, [debugMode])

  // Save to localStorage whenever categories change
  useEffect(() => {
    localStorage.setItem('gw2-gameplan-data', JSON.stringify(categories))
  }, [categories])

  // Check for resets every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCategories(prevCategories => checkAndResetTasks(prevCategories, debugMode))
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [debugMode])

  const addTask = (categoryKey, taskText) => {
    if (!taskText.trim()) return

    const currentTime = debugMode.useFakeTime 
      ? debugMode.fakeTime 
      : new Date().toISOString()

    setCategories(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        tasks: [
          ...prev[categoryKey].tasks,
          {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: currentTime,
            lastCompleted: null,
            completionHistory: []
          }
        ]
      }
    }))
  }

  const toggleTask = (categoryKey, taskId) => {
    const currentTime = debugMode.useFakeTime 
      ? debugMode.fakeTime 
      : new Date().toISOString()
    
    setCategories(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        tasks: prev[categoryKey].tasks.map(task => {
          if (task.id === taskId) {
            const isCompletingNow = !task.completed
            const completionHistory = task.completionHistory || []
            const resetType = prev[categoryKey].resetType
            
            const updatedHistory = toggleCompletion(
              completionHistory,
              currentTime,
              resetType,
              isCompletingNow
            )
            
            return {
              ...task,
              completed: isCompletingNow,
              lastCompleted: isCompletingNow ? currentTime : task.lastCompleted,
              completionHistory: updatedHistory
            }
          }
          return task
        })
      }
    }))
  }

  const deleteTask = (categoryKey, taskId) => {
    setCategories(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        tasks: prev[categoryKey].tasks.filter(task => task.id !== taskId)
      }
    }))
  }

  const reorderTasks = (categoryKey, fromIndex, toIndex) => {
    setCategories(prev => {
      const tasks = [...prev[categoryKey].tasks]
      const [movedTask] = tasks.splice(fromIndex, 1)
      tasks.splice(toIndex, 0, movedTask)
      
      return {
        ...prev,
        [categoryKey]: {
          ...prev[categoryKey],
          tasks
        }
      }
    })
  }

  const editTask = (categoryKey, taskId, newText) => {
    if (!newText.trim()) return

    setCategories(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        tasks: prev[categoryKey].tasks.map(task =>
          task.id === taskId ? { ...task, text: newText } : task
        )
      }
    }))
  }

  const clearAllLastCompleted = () => {
    setCategories(prev => {
      const updated = {}
      for (const [key, category] of Object.entries(prev)) {
        updated[key] = {
          ...category,
          tasks: category.tasks.map(task => ({
            ...task,
            completed: false,
            lastCompleted: null,
            completionHistory: []
          }))
        }
      }
      return updated
    })
  }

  const exportData = () => {
    const dataToExport = {
      categories,
      debugMode,
      exportDate: new Date().toISOString(),
      version: '0.5.0'
    }
    
    const dataStr = JSON.stringify(dataToExport, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `gw2-gameplan-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importData = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result)
        
        if (imported.categories) {
          setCategories(imported.categories)
        }
        if (imported.debugMode) {
          setDebugMode(imported.debugMode)
        }
        
        alert('Data imported successfully!')
      } catch (error) {
        console.error('Failed to import data:', error)
        alert('Failed to import data. Please check the file format.')
      }
    }
    reader.readAsText(file)
    
    // Reset the input so the same file can be imported again
    event.target.value = ''
  }

  const clearAllData = () => {
    console.log('clearAllData called')
    console.log('Clearing localStorage...')
    
    // Clear localStorage first
    localStorage.removeItem('gw2-gameplan-data')
    localStorage.removeItem('gw2-debug-mode')
    
    // Reset to initial categories (fresh, not from localStorage)
    const freshCategories = {
      coffeeWeeklies: {
        title: '📅 Quick Weeklies',
        description: 'Resets Mondays at 04:30 UTC-3',
        resetType: 'weekly',
        tasks: [],
        lastResetTime: null
      },
      coffeeDailies: {
        title: '⚡ Quick Dailies',
        description: 'Resets daily at 21:00 UTC-3',
        resetType: 'daily',
        tasks: [],
        lastResetTime: null
      },
      gamingDailies: {
        title: '🎮 Gaming Dailies',
        description: 'Resets daily at 21:00 UTC-3',
        resetType: 'daily',
        tasks: [],
        lastResetTime: null
      },
      workingGoals: {
        title: '🎯 Working Goals',
        description: 'No reset - permanent progress',
        resetType: 'none',
        tasks: [],
        lastResetTime: null
      }
    }
    
    console.log('Setting fresh categories:', freshCategories)
    setCategories(freshCategories)
    
    // Reset debug mode
    setDebugMode({
      useFakeTime: false,
      fakeTime: new Date().toISOString()
    })
    
    console.log('All data cleared!')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚔️ Guild Wars 2 Gameplan Tracker</h1>
        <p className="subtitle">Stay on top of your daily and weekly tasks</p>
      </header>

      <div className="categories-grid">
        {Object.entries(categories).map(([key, category]) => (
          <TaskCategory
            key={key}
            category={category}
            debugMode={debugMode}
            onAddTask={(text) => addTask(key, text)}
            onToggleTask={(taskId) => toggleTask(key, taskId)}
            onDeleteTask={(taskId) => deleteTask(key, taskId)}
            onEditTask={(taskId, newText) => editTask(key, taskId, newText)}
            onReorderTasks={(fromIndex, toIndex) => reorderTasks(key, fromIndex, toIndex)}
          />
        ))}
      </div>

      <DebugPanel 
        debugMode={debugMode}
        onDebugModeChange={setDebugMode}
        onClearLastCompleted={clearAllLastCompleted}
        onExportData={exportData}
        onImportData={importData}
        onClearAllData={clearAllData}
      />
    </div>
  )
}

export default App
