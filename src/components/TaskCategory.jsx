import { useState, useEffect } from 'react'
import './TaskCategory.css'
import HabitTracker from './HabitTracker'
import { getTimeUntilReset, formatTimestamp } from '../utils/dateHelpers'

function TaskCategory({ category, debugMode, onAddTask, onToggleTask, onDeleteTask, onEditTask, onReorderTasks }) {
  const [newTaskText, setNewTaskText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [showCompleted, setShowCompleted] = useState(true)
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
  
  // For 'none' reset type, separate active and completed tasks
  const activeTasks = category.resetType === 'none' 
    ? category.tasks.filter(t => !t.completed)
    : category.tasks
  const completedTasks = category.resetType === 'none'
    ? category.tasks.filter(t => t.completed)
    : []

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
        
        {/* Active tasks (or all tasks for resetTypes other than 'none') */}
        {activeTasks.map((task, index) => (
          <div
            key={task.id}
            className={`task-item ${task.completed ? 'completed' : ''} ${
              draggedIndex === index ? 'dragging' : ''
            } ${dragOverIndex === index ? 'drag-over' : ''} ${
              editingTaskId === task.id ? 'editing' : ''
            }`}
            draggable={editingTaskId !== task.id && category.resetType !== 'none'}
            onDragStart={(e) => category.resetType !== 'none' && handleDragStart(e, index)}
            onDragOver={(e) => category.resetType !== 'none' && handleDragOver(e, index)}
            onDragLeave={category.resetType !== 'none' ? handleDragLeave : undefined}
            onDrop={(e) => category.resetType !== 'none' && handleDrop(e, index)}
            onDragEnd={category.resetType !== 'none' ? handleDragEnd : undefined}
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
                <div className="task-main-content">
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
                </div>
                <div className="task-actions">
                  {category.resetType !== 'none' && (
                    <HabitTracker 
                      task={task} 
                      resetType={category.resetType}
                      debugMode={debugMode}
                      isExpanded={expandedTaskId === task.id}
                      onToggleExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    />
                  )}
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
        
        {/* Completed tasks section (only for 'none' reset type) */}
        {category.resetType === 'none' && completedTasks.length > 0 && (
          <div className="completed-section">
            <button 
              className="completed-section-toggle"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              <span className="toggle-icon">{showCompleted ? '▼' : '▶'}</span>
              Completed ({completedTasks.length})
            </button>
            
            {showCompleted && completedTasks.map((task, index) => (
              <div
                key={task.id}
                className="task-item completed"
              >
                <span className="drag-handle" style={{ opacity: 0.3 }}>⋮⋮</span>
                <div className="task-main-content">
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
                </div>
                <div className="task-actions">
                  <button
                    className="delete-btn"
                    onClick={() => onDeleteTask(task.id)}
                    aria-label="Delete task"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
