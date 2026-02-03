import { useState } from 'react'
import './DebugPanel.css'

function DebugPanel({ debugMode, onDebugModeChange, onClearLastCompleted }) {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingFakeTime, setPendingFakeTime] = useState(debugMode.fakeTime)

  const formatDateTimeLocal = (date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleTimeChange = (e) => {
    setPendingFakeTime(new Date(e.target.value).toISOString())
  }

  const handleToggle = (e) => {
    onDebugModeChange({
      ...debugMode,
      useFakeTime: e.target.checked
    })
  }

  const resetToCurrentTime = () => {
    setPendingFakeTime(new Date().toISOString())
  }

  const applyFakeTime = () => {
    onDebugModeChange({
      ...debugMode,
      fakeTime: pendingFakeTime
    })
  }

  const currentDisplayTime = debugMode.useFakeTime 
    ? new Date(debugMode.fakeTime).toLocaleString()
    : new Date().toLocaleString()

  return (
    <div className="debug-panel">
      <button 
        className="debug-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Debug Panel"
      >
        🔧 {isOpen ? '▼' : '▶'}
      </button>
      
      {isOpen && (
        <div className="debug-content">
          <h3>Debug Panel</h3>
          
          <div className="debug-section">
            <label className="debug-checkbox-label">
              <input
                type="checkbox"
                checked={debugMode.useFakeTime}
                onChange={handleToggle}
              />
              <span>Use Fake Time</span>
            </label>
          </div>

          <div className="debug-section">
            <label>
              <span className="debug-label">Set Fake Date & Time:</span>
              <div className="datetime-input-group">
                <input
                  type="datetime-local"
                  value={formatDateTimeLocal(pendingFakeTime)}
                  onChange={handleTimeChange}
                  className="debug-datetime-input"
                />
                <button
                  type="button"
                  className="reset-time-btn"
                  onClick={resetToCurrentTime}
                  title="Reset to current time"
                >
                  ↻
                </button>
                <button
                  type="button"
                  className="apply-time-btn"
                  onClick={applyFakeTime}
                  title="Apply fake time"
                >
                  ✓
                </button>
              </div>
            </label>
          </div>

          <div className="debug-section">
            <div className="debug-info">
              <strong>Current Time (UTC-3):</strong>
              <div className="debug-time">{currentDisplayTime}</div>
            </div>
          </div>

          <div className="debug-section">
            <div className="debug-info">
              <strong>Next Daily Reset:</strong>
              <div className="debug-time">21:00 UTC-3</div>
            </div>
            <div className="debug-info">
              <strong>Next Weekly Reset:</strong>
              <div className="debug-time">Monday 04:30 UTC-3</div>
            </div>
          </div>

          <div className="debug-section">
            <button 
              className="debug-clear-btn"
              onClick={onClearLastCompleted}
            >
              Clear All "Last Done" Timestamps
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DebugPanel
