'use client'

import { AgentType } from '@/types/book'

interface Step {
  id: AgentType
  name: string
  emoji: string
}

const steps: Step[] = [
  { id: 'research', name: 'Research', emoji: '🔍' },
  { id: 'outliner', name: 'Outline', emoji: '📋' },
  { id: 'writer', name: 'Write', emoji: '✍️' },
  { id: 'editor', name: 'Edit', emoji: '📝' },
  { id: 'critic', name: 'Review', emoji: '⭐' },
]

interface ProgressStepperProps {
  currentAgent: AgentType | null
  completedAgents: AgentType[]
  isCompleted: boolean
}

export default function ProgressStepper({
  currentAgent,
  completedAgents,
  isCompleted,
}: ProgressStepperProps) {
  const getStepStatus = (stepId: AgentType) => {
    if (isCompleted) return 'completed'
    if (completedAgents.includes(stepId)) return 'completed'
    if (currentAgent === stepId) return 'current'
    return 'pending'
  }

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id)
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl
                    transition-all duration-300 ease-in-out
                    ${status === 'completed'
                      ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                      : status === 'current'
                        ? 'bg-indigo-500 text-white animate-pulse shadow-lg shadow-indigo-200'
                        : 'bg-gray-200 text-gray-400'
                    }
                  `}
                >
                  {status === 'completed' ? '✓' : step.emoji}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${status === 'completed'
                      ? 'text-green-600'
                      : status === 'current'
                        ? 'text-indigo-600'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 rounded transition-all duration-500
                    ${completedAgents.includes(step.id) ||
                      (currentAgent && steps.findIndex(s => s.id === currentAgent) > index)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                    }
                  `}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
