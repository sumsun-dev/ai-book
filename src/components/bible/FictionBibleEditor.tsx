'use client'

import { useState } from 'react'
import type {
  FictionBible,
  FictionCharacter,
  WorldSetting,
  PlotThread,
  Foreshadowing,
  FictionSubgenre,
  FantasySettings,
  MartialArtsSettings,
  RomanceFantasySettings,
  HunterSettings,
} from '@/types/book-bible'
import { generateBibleItemId } from '@/types/book-bible'
import {
  FantasySettingsEditor,
  MartialArtsSettingsEditor,
  RomanceFantasySettingsEditor,
  HunterSettingsEditor,
} from './genre'

interface FictionBibleEditorProps {
  bible: FictionBible
  onChange: (bible: FictionBible) => void
}

type TabType = 'characters' | 'world' | 'plot' | 'foreshadowing' | 'style' | 'genre'

const subgenreLabels: Record<FictionSubgenre, string> = {
  general: '일반 소설',
  fantasy: '판타지',
  'martial-arts': '무협',
  'romance-fantasy': '로맨스 판타지',
  hunter: '헌터/현대 판타지',
  romance: '현대 로맨스',
  mystery: '미스터리',
}

export default function FictionBibleEditor({ bible, onChange }: FictionBibleEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('characters')
  const hasGenreSettings = bible.subgenre && bible.subgenre !== 'general'

  const getGenreSettingsCount = (): number => {
    switch (bible.subgenre) {
      case 'fantasy':
        return (bible.fantasySettings?.magicSystems.length || 0) +
               (bible.fantasySettings?.races.length || 0) +
               (bible.fantasySettings?.skills.length || 0)
      case 'martial-arts':
        return (bible.martialArtsSettings?.techniques.length || 0) +
               (bible.martialArtsSettings?.factions.length || 0)
      case 'romance-fantasy':
        return (bible.romanceFantasySettings?.nobleFamilies.length || 0) +
               (bible.romanceFantasySettings?.relationships.length || 0)
      case 'hunter':
        return (bible.hunterSettings?.hunterRanks.length || 0) +
               (bible.hunterSettings?.gates.length || 0) +
               (bible.hunterSettings?.skills.length || 0)
      default:
        return 0
    }
  }

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'characters', label: '캐릭터', count: bible.characters.length },
    { id: 'world', label: '세계관', count: bible.worldSettings.length },
    ...(hasGenreSettings && bible.subgenre ? [{ id: 'genre' as TabType, label: subgenreLabels[bible.subgenre] || '장르', count: getGenreSettingsCount() }] : []),
    { id: 'plot', label: '플롯', count: bible.plotThreads.length },
    { id: 'foreshadowing', label: '복선', count: bible.foreshadowing.length },
    { id: 'style', label: '문체' },
  ]

  const handleSubgenreChange = (newSubgenre: FictionSubgenre) => {
    const updated: FictionBible = { ...bible, subgenre: newSubgenre }

    // 장르별 기본 설정 초기화
    if (newSubgenre === 'fantasy' && !bible.fantasySettings) {
      updated.fantasySettings = { magicSystems: [], races: [], skills: [], powerLevels: [] }
    } else if (newSubgenre === 'martial-arts' && !bible.martialArtsSettings) {
      updated.martialArtsSettings = { internalEnergies: [], techniques: [], factions: [] }
    } else if (newSubgenre === 'romance-fantasy' && !bible.romanceFantasySettings) {
      updated.romanceFantasySettings = { nobleFamilies: [], relationships: [] }
    } else if (newSubgenre === 'hunter' && !bible.hunterSettings) {
      updated.hunterSettings = { hunterRanks: [], gates: [], skills: [], guilds: [] }
    }

    onChange(updated)
  }

  return (
    <div>
      {/* 장르 선택 */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
        <label className="text-sm text-neutral-500 dark:text-neutral-400">소설 장르:</label>
        <select
          value={bible.subgenre || 'general'}
          onChange={(e) => handleSubgenreChange(e.target.value as FictionSubgenre)}
          className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded"
        >
          {Object.entries(subgenreLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {hasGenreSettings && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            장르별 설정 활성화됨
          </span>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-700 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-neutral-200 dark:bg-neutral-700 rounded">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'characters' && (
        <CharacterEditor
          characters={bible.characters}
          onChange={(characters) => onChange({ ...bible, characters })}
        />
      )}

      {activeTab === 'world' && (
        <WorldSettingEditor
          settings={bible.worldSettings}
          onChange={(worldSettings) => onChange({ ...bible, worldSettings })}
        />
      )}

      {activeTab === 'plot' && (
        <PlotThreadEditor
          threads={bible.plotThreads}
          characters={bible.characters}
          onChange={(plotThreads) => onChange({ ...bible, plotThreads })}
        />
      )}

      {activeTab === 'foreshadowing' && (
        <ForeshadowingEditor
          items={bible.foreshadowing}
          onChange={(foreshadowing) => onChange({ ...bible, foreshadowing })}
        />
      )}

      {activeTab === 'style' && (
        <StyleGuideEditor
          style={bible.styleGuide}
          characters={bible.characters}
          onChange={(styleGuide) => onChange({ ...bible, styleGuide })}
        />
      )}

      {activeTab === 'genre' && bible.subgenre === 'fantasy' && bible.fantasySettings && (
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            판타지 세계의 마법 체계, 종족, 스킬, 파워 레벨을 설정합니다.
          </p>
          <FantasySettingsEditor
            settings={bible.fantasySettings}
            onChange={(fantasySettings: FantasySettings) => onChange({ ...bible, fantasySettings })}
          />
        </div>
      )}

      {activeTab === 'genre' && bible.subgenre === 'martial-arts' && bible.martialArtsSettings && (
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            무협 세계의 내공, 무공, 문파/세가를 설정합니다.
          </p>
          <MartialArtsSettingsEditor
            settings={bible.martialArtsSettings}
            onChange={(martialArtsSettings: MartialArtsSettings) => onChange({ ...bible, martialArtsSettings })}
          />
        </div>
      )}

      {activeTab === 'genre' && bible.subgenre === 'romance-fantasy' && bible.romanceFantasySettings && (
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            귀족 가문, 관계도, 원작 정보(빙의물)를 설정합니다.
          </p>
          <RomanceFantasySettingsEditor
            settings={bible.romanceFantasySettings}
            onChange={(romanceFantasySettings: RomanceFantasySettings) => onChange({ ...bible, romanceFantasySettings })}
          />
        </div>
      )}

      {activeTab === 'genre' && bible.subgenre === 'hunter' && bible.hunterSettings && (
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            헌터 등급, 게이트/던전, 스킬, 길드를 설정합니다.
          </p>
          <HunterSettingsEditor
            settings={bible.hunterSettings}
            onChange={(hunterSettings: HunterSettings) => onChange({ ...bible, hunterSettings })}
          />
        </div>
      )}
    </div>
  )
}

// ===== Character Editor =====
function CharacterEditor({
  characters,
  onChange,
}: {
  characters: FictionCharacter[]
  onChange: (characters: FictionCharacter[]) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const addCharacter = () => {
    const newChar: FictionCharacter = {
      id: generateBibleItemId(),
      name: '',
      role: 'supporting',
      description: '',
      traits: [],
    }
    onChange([...characters, newChar])
    setEditingId(newChar.id)
  }

  const updateCharacter = (id: string, updates: Partial<FictionCharacter>) => {
    onChange(characters.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteCharacter = (id: string) => {
    if (confirm('이 캐릭터를 삭제하시겠습니까?')) {
      onChange(characters.filter(c => c.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          등장인물의 이름, 역할, 특성을 관리합니다. AI가 일관되게 캐릭터를 묘사합니다.
        </p>
        <button
          onClick={addCharacter}
          className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          + 캐릭터 추가
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-700">
          등록된 캐릭터가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {characters.map(char => (
            <div
              key={char.id}
              className="border border-neutral-200 dark:border-neutral-700 p-4"
            >
              {editingId === char.id ? (
                <CharacterForm
                  character={char}
                  onChange={(updates) => updateCharacter(char.id, updates)}
                  onClose={() => setEditingId(null)}
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {char.name || '(이름 없음)'}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        {getRoleName(char.role)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                      {char.description || '(설명 없음)'}
                    </p>
                    {char.traits && char.traits.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {char.traits.map((trait, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                            {trait}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(char.id)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteCharacter(char.id)}
                      className="text-neutral-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CharacterForm({
  character,
  onChange,
  onClose,
}: {
  character: FictionCharacter
  onChange: (updates: Partial<FictionCharacter>) => void
  onClose: () => void
}) {
  const [traitsInput, setTraitsInput] = useState(character.traits?.join(', ') || '')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">이름</label>
          <input
            type="text"
            value={character.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            placeholder="캐릭터 이름"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">역할</label>
          <select
            value={character.role}
            onChange={(e) => onChange({ role: e.target.value as FictionCharacter['role'] })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
          >
            <option value="protagonist">주인공</option>
            <option value="antagonist">적대자</option>
            <option value="supporting">조연</option>
            <option value="minor">단역</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">설명 (외모, 성격 등)</label>
        <textarea
          value={character.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
          placeholder="캐릭터에 대한 설명을 입력하세요"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">성격 특성 (쉼표로 구분)</label>
        <input
          type="text"
          value={traitsInput}
          onChange={(e) => {
            setTraitsInput(e.target.value)
            const traits = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
            onChange({ traits })
          }}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
          placeholder="용감한, 내성적, 정의로운"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">첫 등장 챕터</label>
          <input
            type="number"
            min={1}
            value={character.firstAppearance || ''}
            onChange={(e) => onChange({ firstAppearance: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">별명/호칭 (쉼표로 구분)</label>
          <input
            type="text"
            value={character.aliases?.join(', ') || ''}
            onChange={(e) => {
              const aliases = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              onChange({ aliases })
            }}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            placeholder="철수, 김대리"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          완료
        </button>
      </div>
    </div>
  )
}

// ===== World Setting Editor =====
function WorldSettingEditor({
  settings,
  onChange,
}: {
  settings: WorldSetting[]
  onChange: (settings: WorldSetting[]) => void
}) {
  const addSetting = () => {
    const newSetting: WorldSetting = {
      id: generateBibleItemId(),
      category: 'location',
      name: '',
      description: '',
    }
    onChange([...settings, newSetting])
  }

  const updateSetting = (id: string, updates: Partial<WorldSetting>) => {
    onChange(settings.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const deleteSetting = (id: string) => {
    if (confirm('이 설정을 삭제하시겠습니까?')) {
      onChange(settings.filter(s => s.id !== id))
    }
  }

  const categories: WorldSetting['category'][] = ['location', 'culture', 'technology', 'magic', 'politics', 'history', 'other']

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          세계관, 장소, 문화, 기술 등의 설정을 관리합니다.
        </p>
        <button
          onClick={addSetting}
          className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          + 설정 추가
        </button>
      </div>

      {settings.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-700">
          등록된 세계관 설정이 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {settings.map(setting => (
            <div key={setting.id} className="border border-neutral-200 dark:border-neutral-700 p-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-2">
                  <select
                    value={setting.category}
                    onChange={(e) => updateSetting(setting.id, { category: e.target.value as WorldSetting['category'] })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{getCategoryName(cat)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={setting.name}
                    onChange={(e) => updateSetting(setting.id, { name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="이름"
                  />
                </div>
                <div className="col-span-6">
                  <input
                    type="text"
                    value={setting.description}
                    onChange={(e) => updateSetting(setting.id, { description: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="설명"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => deleteSetting(setting.id)}
                    className="text-neutral-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Plot Thread Editor =====
function PlotThreadEditor({
  threads,
  characters: _characters,
  onChange,
}: {
  threads: PlotThread[]
  characters: FictionCharacter[]
  onChange: (threads: PlotThread[]) => void
}) {
  const addThread = () => {
    const newThread: PlotThread = {
      id: generateBibleItemId(),
      name: '',
      type: 'main',
      description: '',
      status: 'setup',
    }
    onChange([...threads, newThread])
  }

  const updateThread = (id: string, updates: Partial<PlotThread>) => {
    onChange(threads.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const deleteThread = (id: string) => {
    if (confirm('이 플롯을 삭제하시겠습니까?')) {
      onChange(threads.filter(t => t.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          메인 플롯과 서브 플롯을 관리합니다.
        </p>
        <button
          onClick={addThread}
          className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          + 플롯 추가
        </button>
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-700">
          등록된 플롯이 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map(thread => (
            <div key={thread.id} className="border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <input
                    type="text"
                    value={thread.name}
                    onChange={(e) => updateThread(thread.id, { name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="플롯 이름"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={thread.type}
                    onChange={(e) => updateThread(thread.id, { type: e.target.value as PlotThread['type'] })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="main">메인</option>
                    <option value="subplot">서브</option>
                    <option value="backstory">배경</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <select
                    value={thread.status}
                    onChange={(e) => updateThread(thread.id, { status: e.target.value as PlotThread['status'] })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="setup">설정</option>
                    <option value="developing">전개</option>
                    <option value="climax">클라이맥스</option>
                    <option value="resolved">해결</option>
                  </select>
                </div>
                <div className="col-span-3 flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={thread.startChapter || ''}
                    onChange={(e) => updateThread(thread.id, { startChapter: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="시작"
                  />
                  <input
                    type="number"
                    min={1}
                    value={thread.endChapter || ''}
                    onChange={(e) => updateThread(thread.id, { endChapter: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="종료"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => deleteThread(thread.id)}
                    className="text-neutral-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <textarea
                value={thread.description}
                onChange={(e) => updateThread(thread.id, { description: e.target.value })}
                rows={2}
                className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                placeholder="플롯 설명"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Foreshadowing Editor =====
function ForeshadowingEditor({
  items,
  onChange,
}: {
  items: Foreshadowing[]
  onChange: (items: Foreshadowing[]) => void
}) {
  const addItem = () => {
    const newItem: Foreshadowing = {
      id: generateBibleItemId(),
      hint: '',
      payoff: '',
      status: 'planted',
      importance: 'minor',
    }
    onChange([...items, newItem])
  }

  const updateItem = (id: string, updates: Partial<Foreshadowing>) => {
    onChange(items.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const deleteItem = (id: string) => {
    if (confirm('이 복선을 삭제하시겠습니까?')) {
      onChange(items.filter(f => f.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          복선과 회수를 추적합니다. AI가 적절한 시점에 복선을 회수하도록 합니다.
        </p>
        <button
          onClick={addItem}
          className="px-3 py-1.5 text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          + 복선 추가
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-700">
          등록된 복선이 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
              <div className="flex gap-4 items-center">
                <select
                  value={item.status}
                  onChange={(e) => updateItem(item.id, { status: e.target.value as Foreshadowing['status'] })}
                  className={`px-2 py-1 text-xs border ${
                    item.status === 'planted'
                      ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : item.status === 'resolved'
                      ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <option value="planted">설치됨</option>
                  <option value="resolved">회수됨</option>
                  <option value="abandoned">포기</option>
                </select>
                <select
                  value={item.importance}
                  onChange={(e) => updateItem(item.id, { importance: e.target.value as Foreshadowing['importance'] })}
                  className="px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                >
                  <option value="major">중요</option>
                  <option value="minor">일반</option>
                </select>
                <div className="flex gap-2 items-center flex-1">
                  <input
                    type="number"
                    min={1}
                    value={item.plantedChapter || ''}
                    onChange={(e) => updateItem(item.id, { plantedChapter: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-20 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="설치"
                  />
                  <span className="text-neutral-400">→</span>
                  <input
                    type="number"
                    min={1}
                    value={item.resolvedChapter || ''}
                    onChange={(e) => updateItem(item.id, { resolvedChapter: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-20 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="회수"
                  />
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-neutral-400 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">복선 (힌트)</label>
                  <textarea
                    value={item.hint}
                    onChange={(e) => updateItem(item.id, { hint: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="설치할 복선 내용"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">회수 내용</label>
                  <textarea
                    value={item.payoff}
                    onChange={(e) => updateItem(item.id, { payoff: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="복선을 회수하는 방법/내용"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Style Guide Editor =====
function StyleGuideEditor({
  style,
  characters,
  onChange,
}: {
  style: FictionBible['styleGuide']
  characters: FictionCharacter[]
  onChange: (style: FictionBible['styleGuide']) => void
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        문체와 서술 규칙을 설정합니다. AI가 일관된 문체를 유지합니다.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">시점</label>
          <select
            value={style.pov}
            onChange={(e) => onChange({ ...style, pov: e.target.value as FictionBible['styleGuide']['pov'] })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          >
            <option value="first">1인칭</option>
            <option value="third-limited">3인칭 제한</option>
            <option value="third-omniscient">3인칭 전지</option>
            <option value="second">2인칭</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">시제</label>
          <select
            value={style.tense}
            onChange={(e) => onChange({ ...style, tense: e.target.value as FictionBible['styleGuide']['tense'] })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          >
            <option value="past">과거 시제</option>
            <option value="present">현재 시제</option>
          </select>
        </div>
      </div>

      {(style.pov === 'first' || style.pov === 'third-limited') && (
        <div>
          <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">시점 캐릭터</label>
          <select
            value={style.povCharacter || ''}
            onChange={(e) => onChange({ ...style, povCharacter: e.target.value || undefined })}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          >
            <option value="">선택하세요</option>
            {characters.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">스타일 규칙 (한 줄에 하나씩)</label>
        <textarea
          value={style.rules?.join('\n') || ''}
          onChange={(e) => onChange({ ...style, rules: e.target.value.split('\n').filter(Boolean) })}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="짧은 문장 위주로 작성&#10;감각적 묘사 활용&#10;대화는 '-요' 체로 통일"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">특수 용어 (쉼표로 구분)</label>
        <input
          type="text"
          value={style.vocabulary?.join(', ') || ''}
          onChange={(e) => onChange({ ...style, vocabulary: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="마나, 던전, 헌터"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-2">금지 사항 (쉼표로 구분)</label>
        <input
          type="text"
          value={style.prohibitions?.join(', ') || ''}
          onChange={(e) => onChange({ ...style, prohibitions: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })}
          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          placeholder="과도한 부사 사용, 설명조의 문장"
        />
      </div>
    </div>
  )
}

// ===== Helper Functions =====

function getRoleName(role: FictionCharacter['role']): string {
  const map: Record<string, string> = {
    protagonist: '주인공',
    antagonist: '적대자',
    supporting: '조연',
    minor: '단역',
  }
  return map[role] || role
}

function getCategoryName(category: WorldSetting['category']): string {
  const map: Record<string, string> = {
    location: '장소',
    culture: '문화',
    technology: '기술',
    magic: '마법',
    politics: '정치',
    history: '역사',
    other: '기타',
  }
  return map[category] || category
}
