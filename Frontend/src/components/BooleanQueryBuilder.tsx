import { useState, useCallback } from 'react'
import Check from 'lucide-react/dist/esm/icons/check'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down'
import Copy from 'lucide-react/dist/esm/icons/copy'
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical'
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle'
import Plus from 'lucide-react/dist/esm/icons/plus'
import Search from 'lucide-react/dist/esm/icons/search'
import Trash2 from 'lucide-react/dist/esm/icons/trash-2'

interface QueryCondition {
  id: string
  type: 'keyword' | 'phrase' | 'hashtag' | 'mention' | 'exclude'
  value: string
}

interface QueryGroup {
  id: string
  operator: 'AND' | 'OR'
  conditions: QueryCondition[]
}

interface BooleanQueryBuilderProps {
  initialQuery?: string
  onQueryChange: (query: string) => void
  onApply?: () => void
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9)

// Parse a simple boolean query string into groups
const parseQuery = (query: string): QueryGroup[] => {
  if (!query.trim()) return [createEmptyGroup()]
  
  // Simple parser - split by OR first, then AND
  const orParts = query.split(/\s+OR\s+/i)
  
  return orParts.map(part => {
    const conditions: QueryCondition[] = []
    const tokens = part.match(/-?"[^"]+"|#\w+|@\w+|-\w+|\w+/g) || []
    
    tokens.forEach(token => {
      if (token.startsWith('-"')) {
        conditions.push({ id: generateId(), type: 'exclude', value: token.slice(2, -1) })
      } else if (token.startsWith('-')) {
        conditions.push({ id: generateId(), type: 'exclude', value: token.slice(1) })
      } else if (token.startsWith('"')) {
        conditions.push({ id: generateId(), type: 'phrase', value: token.slice(1, -1) })
      } else if (token.startsWith('#')) {
        conditions.push({ id: generateId(), type: 'hashtag', value: token.slice(1) })
      } else if (token.startsWith('@')) {
        conditions.push({ id: generateId(), type: 'mention', value: token.slice(1) })
      } else if (token.toLowerCase() !== 'and') {
        conditions.push({ id: generateId(), type: 'keyword', value: token })
      }
    })
    
    return {
      id: generateId(),
      operator: 'AND' as const,
      conditions: conditions.length > 0 ? conditions : [createEmptyCondition()],
    }
  })
}

// Create an empty condition
const createEmptyCondition = (): QueryCondition => ({
  id: generateId(),
  type: 'keyword',
  value: '',
})

// Create an empty group
const createEmptyGroup = (): QueryGroup => ({
  id: generateId(),
  operator: 'AND',
  conditions: [createEmptyCondition()],
})

// Convert groups back to query string
const buildQuery = (groups: QueryGroup[]): string => {
  return groups
    .map(group => {
      const parts = group.conditions
        .filter(c => c.value.trim())
        .map(c => {
          switch (c.type) {
            case 'phrase':
              return `"${c.value}"`
            case 'hashtag':
              return `#${c.value.replace(/^#/, '')}`
            case 'mention':
              return `@${c.value.replace(/^@/, '')}`
            case 'exclude':
              return c.value.includes(' ') ? `-"${c.value}"` : `-${c.value}`
            default:
              return c.value
          }
        })
      
      return parts.join(` ${group.operator} `)
    })
    .filter(Boolean)
    .join(' OR ')
}

// Condition type configuration
const CONDITION_TYPES = [
  { value: 'keyword', label: 'Keyword', icon: '🔤', description: 'Match this word anywhere' },
  { value: 'phrase', label: 'Exact Phrase', icon: '📝', description: 'Match this exact phrase' },
  { value: 'hashtag', label: 'Hashtag', icon: '#️⃣', description: 'Match hashtag (e.g., #Nepal)' },
  { value: 'mention', label: 'Mention', icon: '@', description: 'Match user mention' },
  { value: 'exclude', label: 'Exclude', icon: '🚫', description: 'Exclude mentions with this' },
] as const

export default function BooleanQueryBuilder({ 
  initialQuery = '', 
  onQueryChange,
  onApply,
}: BooleanQueryBuilderProps) {
  const [groups, setGroups] = useState<QueryGroup[]>(() => parseQuery(initialQuery))
  const [showHelp, setShowHelp] = useState(false)
  const [copied, setCopied] = useState(false)

  // Update query string whenever groups change
  const updateQuery = useCallback((newGroups: QueryGroup[]) => {
    setGroups(newGroups)
    onQueryChange(buildQuery(newGroups))
  }, [onQueryChange])

  // Add a new condition to a group
  const addCondition = (groupId: string) => {
    updateQuery(
      groups.map(g => 
        g.id === groupId 
          ? { ...g, conditions: [...g.conditions, createEmptyCondition()] }
          : g
      )
    )
  }

  // Remove a condition from a group
  const removeCondition = (groupId: string, conditionId: string) => {
    updateQuery(
      groups.map(g => {
        if (g.id !== groupId) return g
        const newConditions = g.conditions.filter(c => c.id !== conditionId)
        return { ...g, conditions: newConditions.length > 0 ? newConditions : [createEmptyCondition()] }
      })
    )
  }

  // Update a condition
  const updateCondition = (groupId: string, conditionId: string, updates: Partial<QueryCondition>) => {
    updateQuery(
      groups.map(g => 
        g.id === groupId 
          ? { 
              ...g, 
              conditions: g.conditions.map(c => 
                c.id === conditionId ? { ...c, ...updates } : c
              )
            }
          : g
      )
    )
  }

  // Add a new group (OR)
  const addGroup = () => {
    updateQuery([...groups, createEmptyGroup()])
  }

  // Remove a group
  const removeGroup = (groupId: string) => {
    const newGroups = groups.filter(g => g.id !== groupId)
    updateQuery(newGroups.length > 0 ? newGroups : [createEmptyGroup()])
  }

  // Toggle group operator
  const toggleGroupOperator = (groupId: string) => {
    updateQuery(
      groups.map(g => 
        g.id === groupId 
          ? { ...g, operator: g.operator === 'AND' ? 'OR' : 'AND' }
          : g
      )
    )
  }

  // Copy query to clipboard
  const copyQuery = () => {
    navigator.clipboard.writeText(buildQuery(groups))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Reset to initial
  const resetQuery = () => {
    updateQuery(parseQuery(initialQuery))
  }

  const currentQuery = buildQuery(groups)

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Search className='h-5 w-5 text-(--brand-accent)' />
          <h3 className='font-semibold'>Query Builder</h3>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className='flex items-center gap-1 text-sm text-(--text-muted) hover:text-(--text-base)'
        >
          <HelpCircle className='h-4 w-4' />
          Help
        </button>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20'>
          <h4 className='mb-2 font-semibold'>How to use the Query Builder</h4>
          <ul className='space-y-1 text-(--text-muted)'>
            <li><strong>Keyword:</strong> Matches mentions containing this word</li>
            <li><strong>Exact Phrase:</strong> Matches the exact phrase (use for names, titles)</li>
            <li><strong>Hashtag:</strong> Matches #hashtags in social posts</li>
            <li><strong>Mention:</strong> Matches @mentions of users</li>
            <li><strong>Exclude:</strong> Removes mentions containing this term</li>
            <li><strong>AND:</strong> All conditions in a group must match</li>
            <li><strong>OR:</strong> Any condition in a group can match</li>
          </ul>
          <p className='mt-2 text-xs'>Groups are combined with OR. Add multiple groups to broaden your search.</p>
        </div>
      )}

      {/* Groups */}
      <div className='space-y-4'>
        {groups.map((group, groupIdx) => (
          <div key={group.id} className='relative'>
            {/* OR Divider between groups */}
            {groupIdx > 0 && (
              <div className='mb-4 flex items-center'>
                <div className='flex-1 border-t border-(--border)' />
                <span className='mx-4 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'>
                  OR
                </span>
                <div className='flex-1 border-t border-(--border)' />
              </div>
            )}

            {/* Group Container */}
            <div className='rounded-xl border border-(--border) bg-(--surface-muted) p-4'>
              {/* Group Header */}
              <div className='mb-3 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <GripVertical className='h-4 w-4 text-(--text-muted)' />
                  <span className='text-sm font-medium'>Group {groupIdx + 1}</span>
                  <button
                    onClick={() => toggleGroupOperator(group.id)}
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      group.operator === 'AND' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {group.operator}
                  </button>
                </div>
                {groups.length > 1 && (
                  <button
                    onClick={() => removeGroup(group.id)}
                    className='rounded-lg p-1 text-(--text-muted) hover:bg-red-100 hover:text-red-600'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                )}
              </div>

              {/* Conditions */}
              <div className='space-y-2'>
                {group.conditions.map((condition, condIdx) => (
                  <div key={condition.id} className='flex items-center gap-2'>
                    {/* AND indicator between conditions */}
                    {condIdx > 0 && (
                      <span className='w-12 text-center text-xs font-medium text-(--text-muted)'>
                        {group.operator}
                      </span>
                    )}
                    {condIdx === 0 && <span className='w-12' />}

                    {/* Condition Type Selector */}
                    <div className='relative'>
                      <select
                        value={condition.type}
                        onChange={(e) => updateCondition(group.id, condition.id, { type: e.target.value as QueryCondition['type'] })}
                        className='appearance-none rounded-lg border border-(--border) bg-(--surface-base) py-2 pl-3 pr-8 text-sm'
                      >
                        {CONDITION_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)' />
                    </div>

                    {/* Value Input */}
                    <input
                      type='text'
                      value={condition.value}
                      onChange={(e) => updateCondition(group.id, condition.id, { value: e.target.value })}
                      placeholder={CONDITION_TYPES.find(t => t.value === condition.type)?.description}
                      className={`flex-1 rounded-lg border bg-(--surface-base) px-3 py-2 text-sm ${
                        condition.type === 'exclude' 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-(--border) focus:border-(--brand-accent)'
                      }`}
                    />

                    {/* Remove Condition */}
                    <button
                      onClick={() => removeCondition(group.id, condition.id)}
                      className='rounded-lg p-2 text-(--text-muted) hover:bg-(--surface-base) hover:text-red-500'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Condition Button */}
              <button
                onClick={() => addCondition(group.id)}
                className='mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-(--border) py-2 text-sm text-(--text-muted) hover:border-(--brand-accent) hover:text-(--brand-accent)'
              >
                <Plus className='h-4 w-4' />
                Add Condition
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Group Button */}
      <button
        onClick={addGroup}
        className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-(--border) py-3 text-sm font-medium text-(--text-muted) hover:border-(--brand-accent) hover:text-(--brand-accent)'
      >
        <Plus className='h-4 w-4' />
        Add OR Group
      </button>

      {/* Query Preview */}
      <div className='rounded-xl border border-(--border) bg-(--surface-base) p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <span className='text-sm font-medium text-(--text-muted)'>Generated Query</span>
          <button
            onClick={copyQuery}
            className='flex items-center gap-1 text-sm text-(--text-muted) hover:text-(--brand-accent)'
          >
            {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <code className='block rounded-lg bg-(--surface-muted) p-3 text-sm'>
          {currentQuery || <span className='text-(--text-muted)'>Enter conditions to build your query...</span>}
        </code>
      </div>

      {/* Action Buttons */}
      <div className='flex items-center justify-between'>
        <button
          onClick={resetQuery}
          className='rounded-lg px-4 py-2 text-sm text-(--text-muted) hover:bg-(--surface-muted)'
        >
          Reset
        </button>
        <div className='flex gap-2'>
          {onApply && (
            <button
              onClick={onApply}
              disabled={!currentQuery}
              className='rounded-lg bg-(--brand-accent) px-6 py-2 text-sm font-medium text-white hover:bg-(--brand-accent-hover) disabled:opacity-50'
            >
              Apply Query
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
