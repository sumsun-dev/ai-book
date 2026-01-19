'use client'

import { AgentType, AgentMessage } from '@/types/book'

const agentInfo: Record<AgentType, { name: string; emoji: string; bgColor: string; textColor: string; borderColor: string }> = {
  research: {
    name: 'Research Agent',
    emoji: '🔍',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  outliner: {
    name: 'Outliner Agent',
    emoji: '📋',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  writer: {
    name: 'Writer Agent',
    emoji: '✍️',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  editor: {
    name: 'Editor Agent',
    emoji: '📝',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  critic: {
    name: 'Critic Agent',
    emoji: '⭐',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
  },
}

interface AgentActivityPanelProps {
  currentAgent: AgentType | null
  messages: AgentMessage[]
  isProcessing: boolean
}

export default function AgentActivityPanel({
  currentAgent,
  messages,
  isProcessing,
}: AgentActivityPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800">AI Agent Activity</h2>
        {isProcessing && (
          <span className="flex items-center gap-2 text-sm text-indigo-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Processing
          </span>
        )}
      </div>

      {/* Current Agent Indicator */}
      {currentAgent && (
        <div
          className={`
            p-4 rounded-xl mb-6 border-2 transition-all duration-300
            ${agentInfo[currentAgent].bgColor}
            ${agentInfo[currentAgent].borderColor}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-bounce">{agentInfo[currentAgent].emoji}</div>
            <div>
              <div className={`font-semibold ${agentInfo[currentAgent].textColor}`}>
                {agentInfo[currentAgent].name}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <span className="inline-flex">
                  <span className="animate-pulse">Working</span>
                  <span className="animate-[pulse_1s_ease-in-out_0.2s_infinite]">.</span>
                  <span className="animate-[pulse_1s_ease-in-out_0.4s_infinite]">.</span>
                  <span className="animate-[pulse_1s_ease-in-out_0.6s_infinite]">.</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message History */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🤖</div>
            <p>Waiting for AI agents to start...</p>
          </div>
        ) : (
          [...messages].reverse().map((msg, index) => (
            <div
              key={index}
              className={`
                p-3 rounded-lg border transition-all duration-300
                ${agentInfo[msg.agent].bgColor}
                ${agentInfo[msg.agent].borderColor}
                ${index === 0 ? 'animate-fadeIn' : ''}
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{agentInfo[msg.agent].emoji}</span>
                <span className={`text-sm font-medium ${agentInfo[msg.agent].textColor}`}>
                  {agentInfo[msg.agent].name}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {msg.type === 'thinking' ? '💭' : msg.type === 'feedback' ? '💬' : '✅'}
                </span>
              </div>
              <p className="text-sm text-gray-600 pl-7">{msg.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
