import { useState, useEffect, useRef } from 'react'
import './App.css'
import TaskCategory from './components/TaskCategory'
import { checkAndResetTasks } from './utils/resetLogic'

const getInitialCategories = () => {
  const saved = localStorage.getItem('gw2-gameplan-data')
  if (saved) {
    try {
      const parsedData = JSON.parse(saved)
      return checkAndResetTasks(parsedData)
    } catch (e) {
      console.error('Failed to load saved data:', e)
    }
  }
  
  return {
    coffeeWeeklies: {
      title: 'Coffee Run Weeklies',
      description: 'Resets Mondays at 04:30 UTC-3',
      resetType: 'weekly',
      tasks: [],
      lastResetTime: null
    },
    coffeeDailies: {
      title: 'Coffee Run Dailies',
      description: 'Resets daily at 21:00 UTC-3',
      resetType: 'daily',
      tasks: [],
      lastResetTime: null
    },
    gamingDailies: {
      title: 'Gaming Session Dailies',
      description: 'Resets daily at 21:00 UTC-3',
      resetType: 'daily',
      tasks: [],
      lastResetTime: null
    },
    workingGoals: {
      title: 'Working Goals',
      description: 'No reset - permanent progress',
      resetType: 'none',
      tasks: [],
      lastResetTime: null
    }
  }
}

function App() {
  const [categories, setCategories] = useState(getInitialCategories)

  // Save to localStorage whenever categories change
  useEffect(() => {
    localStorage.setItem('gw2-gameplan-data', JSON.stringify(categories))
  }, [categories])

  // Check for resets every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCategories(prevCategories => checkAndResetTasks(prevCategories))
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const addTask = (categoryKey, taskText) => {
    if (!taskText.trim()) return

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
            createdAt: new Date().toISOString(),
            lastCompleted: null
          }
        ]
      }
    }))
  }

  const toggleTask = (categoryKey, taskId) => {
    setCategories(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        tasks: prev[categoryKey].tasks.map(task =>
          task.id === taskId ? { 
            ...task, 
            completed: !task.completed,
            lastCompleted: !task.completed ? new Date().toISOString() : task.lastCompleted
          } : task
        )
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
            onAddTask={(text) => addTask(key, text)}
            onToggleTask={(taskId) => toggleTask(key, taskId)}
            onDeleteTask={(taskId) => deleteTask(key, taskId)}
            onEditTask={(taskId, newText) => editTask(key, taskId, newText)}
            onReorderTasks={(fromIndex, toIndex) => reorderTasks(key, fromIndex, toIndex)}
          />
        ))}
      </div>
    </div>
  )
}

export default App
