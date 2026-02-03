import { useState, useEffect } from 'react'
import './TaskCategory.css'

function getTimeUntilReset(resetType, debugMode = null) {
  if (resetType === 'none') return null

  let now
  if (debugMode && debugMode.useFakeTime) {
    now = new Date(debugMode.fakeTime)
  } else {
    now = new Date()
  }

  // Convert to UTC-3
  const UTC_MINUS_3_OFFSET = -3 * 60
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const utcMinus3 = new Date(utc + (UTC_MINUS_3_OFFSET * 60000))

  let nextReset
  
  if (resetType === 'daily') {
    // Next daily reset at 21:00
    nextReset = new Date(utcMinus3)
    nextReset.setHours(21, 0, 0, 0)
    
    // If we've passed today's reset, move to tomorrow
    if (utcMinus3 >= nextReset) {
      nextReset.setDate(nextReset.getDate() + 1)
    }
  } else if (resetType === 'weekly') {
    // Next weekly reset Monday at 04:30
    nextReset = new Date(utcMinus3)
    const dayOfWeek = nextReset.getDay() // 0 = Sunday, 1 = Monday
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7
    
    nextReset.setDate(nextReset.getDate() + daysUntilMonday)
    nextReset.setHours(4, 30, 0, 0)
    
    // If it's Monday but we've passed the reset time
    if (dayOfWeek === 1 && utcMinus3.getHours() >= 4 && utcMinus3.getMinutes() >= 30) {
      nextReset.setDate(nextReset.getDate() + 7)
    }
    // If it's Monday and before reset time
    if (dayOfWeek === 1 && (utcMinus3.getHours() < 4 || (utcMinus3.getHours() === 4 && utcMinus3.getMinutes() < 30))) {
      nextReset.setDate(nextReset.getDate() - daysUntilMonday)
    }
  }

  const diffMs = nextReset - utcMinus3
  const days = Math.floor(diffMs / 86400000)
  const hours = Math.floor((diffMs % 86400000) / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatTimestamp(isoString, debugMode = null) {
  const date = new Date(isoString)
  let now
  
  if (debugMode && debugMode.useFakeTime) {
    now = new Date(debugMode.fakeTime)
  } else {
    now = new Date()
  }
  
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  // Get formatted date parts
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  const fullTimestamp = `${dayName} ${day}/${month}/${year} at ${hours}:${minutes}`

  let relativeTime
  if (diffMins < 1) relativeTime = 'Just now'
  else if (diffMins < 60) relativeTime = `${diffMins}m ago`
  else if (diffHours < 24) relativeTime = `${diffHours}h ago`
  else if (diffDays < 7) relativeTime = `${diffDays}d ago`
  else relativeTime = null
  
  if (relativeTime) {
    return `${relativeTime}, ${fullTimestamp}`
  }
  
  return fullTimestamp
}

function TaskCategory({ category, debugMode, onAddTask, onToggleTask, onDeleteTask, onEditTask, onReorderTasks }) {
  const [newTaskText, setNewTaskText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [timeUntilReset, setTimeUntilReset] = useState(() => 
    getTimeUntilReset(category.resetType, debugMode)
  )

  // Update time until reset every minute and when debugMode changes
  useEffect(() => {
    setTimeUntilReset(getTimeUntilReset(category.resetType, debugMode))
    
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilReset(category.resetType, debugMode))
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [category.resetType, debugMode])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newTaskText.trim()) {
      onAddTask(newTaskText)
      setNewTaskText('')
      setIsAdding(false)
    }
  }

  const completedCount = category.tasks.filter(t => t.completed).length
  const totalCount = category.tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, index) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderTasks(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const startEditing = (task) => {
    setEditingTaskId(task.id)
    setEditingText(task.text)
  }

  const saveEdit = (taskId) => {
    if (editingText.trim()) {
      onEditTask(taskId, editingText)
      setEditingTaskId(null)
      setEditingText('')
    }
  }

  const cancelEdit = () => {
    setEditingTaskId(null)
    setEditingText('')
  }

  return (
    <div className="task-category">
      <div className="category-header">
        <div className="category-title-row">
          <h2>{category.title}</h2>
          {timeUntilReset && (
            <span className="time-until-reset">Resets in: {timeUntilReset}</span>
          )}
        </div>
        <p className="category-description">{category.description}</p>
        {totalCount > 0 && (
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
        )}
        <p className="task-count">
          {completedCount} / {totalCount} completed
        </p>
      </div>

      <div className="tasks-list">
        {category.tasks.length === 0 && (
          <p className="empty-message">No tasks yet. Add one to get started!</p>
        )}
        
        {category.tasks.map((task, index) => (
          <div
            key={task.id}
            className={`task-item ${task.completed ? 'completed' : ''} ${
              draggedIndex === index ? 'dragging' : ''
            } ${dragOverIndex === index ? 'drag-over' : ''} ${
              editingTaskId === task.id ? 'editing' : ''
            }`}
            draggable={editingTaskId !== task.id}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {editingTaskId === task.id ? (
              <>
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveEdit(task.id)}
                  className="edit-input"
                  autoFocus
                />
                <div className="edit-buttons">
                  <button
                    className="save-edit-btn"
                    onClick={() => saveEdit(task.id)}
                    aria-label="Save"
                  >
                    ✓
                  </button>
                  <button
                    className="cancel-edit-btn"
                    onClick={cancelEdit}
                    aria-label="Cancel"
                  >
                    ✕
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="drag-handle">⋮⋮</span>
                <label className="task-checkbox">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
                  />
                  <span className="checkmark"></span>
                  <div className="task-content">
                    <span className="task-text">{task.text}</span>
                    {task.lastCompleted && (
                      <span className="last-completed">
                        Last done: {formatTimestamp(task.lastCompleted, debugMode)}
                      </span>
                    )}
                  </div>
                </label>
                <div className="task-actions">
                  <button
                    className="edit-btn"
                    onClick={() => startEditing(task)}
                    aria-label="Edit task"
                  >
                    ✎
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => onDeleteTask(task.id)}
                    aria-label="Delete task"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="add-task-section">
        {!isAdding ? (
          <button
            className="add-task-btn"
            onClick={() => setIsAdding(true)}
          >
            + Add Task
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="add-task-form">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Enter task name..."
              autoFocus
              className="task-input"
            />
            <div className="form-buttons">
              <button type="submit" className="submit-btn">Add</button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setIsAdding(false)
                  setNewTaskText('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default TaskCategory
