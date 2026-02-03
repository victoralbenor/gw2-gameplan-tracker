import { useState } from 'react'
import './TaskCategory.css'

function formatTimestamp(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TaskCategory({ category, onAddTask, onToggleTask, onDeleteTask, onEditTask, onReorderTasks }) {
  const [newTaskText, setNewTaskText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingText, setEditingText] = useState('')

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
        <h2>{category.title}</h2>
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
                        Last done: {formatTimestamp(task.lastCompleted)}
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
