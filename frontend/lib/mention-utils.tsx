import React from 'react'

// Utility functions for handling mentions

export function highlightMentions(text: string, isUserMessage: boolean = false): React.ReactNode {
  // Split text by @mentions and render them with highlighting
  const mentionRegex = /@(\w+)/g
  const parts = text.split(mentionRegex)
  
  return parts.map((part, index) => {
    // Even indices are regular text, odd indices are mention names
    if (index % 2 === 1) {
      return (
        <span 
          key={index}
          className={
            isUserMessage 
              ? "bg-white/20 text-white px-2 py-0.5 rounded-md text-sm font-semibold shadow-sm backdrop-blur-sm border border-white/30"
              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md text-sm font-semibold"
          }
        >
          @{part}
        </span>
      )
    }
    return part
  })
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }
  
  return mentions
}