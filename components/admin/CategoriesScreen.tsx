'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAdminPath } from '@/components/admin/AdminPathContext'
import type { DirectoryCategoryWithCount } from '@/modules/directory/lib/types'

const inputStyle = { padding: '0.375rem 0.625rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)' }

function EditRow({ category, onSave, onCancel }: {
  category: DirectoryCategoryWithCount
  onSave: (fields: { name: string; description: string | null; icon: string | null }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description ?? '')
  const [icon, setIcon] = useState(category.icon ?? '')

  return (
    <tr>
      <td colSpan={5}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.5rem 0' }}>
          <input style={{ ...inputStyle, width: '3rem', textAlign: 'center' }} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🌵" maxLength={4} />
          <input style={{ ...inputStyle, flex: '1 1 160px' }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <input style={{ ...inputStyle, flex: '2 1 240px' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <button className="btn btn-primary btn-sm" onClick={() => onSave({ name, description: description || null, icon: icon || null })}>Save</button>
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        </div>
      </td>
    </tr>
  )
}

export default function CategoriesScreen() {
  const adminPath = useAdminPath()
  const [categories, setCategories] = useState<DirectoryCategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/m/directory/admin/categories')
    const data = await res.json()
    setCategories(data.categories ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- delegating to async helper; all setState calls are after awaits
    load()
  }, [load])

  async function addCategory() {
    if (!newName.trim()) return
    await fetch('/api/m/directory/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: newDescription || null, icon: newIcon || null }),
    })
    setNewName('')
    setNewIcon('')
    setNewDescription('')
    load()
  }

  async function saveCategory(id: string, fields: { name: string; description: string | null; icon: string | null }) {
    await fetch(`/api/m/directory/admin/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    setEditingId(null)
    load()
  }

  async function deleteCategory(category: DirectoryCategoryWithCount) {
    if (category.entryCount > 0) {
      alert(`This category has ${category.entryCount} ${category.entryCount === 1 ? 'entry' : 'entries'} in it. Move or delete them first.`)
      return
    }
    if (!confirm(`Delete "${category.name}"?`)) return
    await fetch(`/api/m/directory/admin/categories/${category.id}`, { method: 'DELETE' })
    load()
  }

  function persistOrder(next: DirectoryCategoryWithCount[]) {
    setCategories(next)
    fetch('/api/m/directory/admin/categories/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: next.map((c) => c.id) }),
    })
  }

  function onDrop(index: number) {
    setDragOverIndex(null)
    if (dragIndex === null || dragIndex === index) { setDragIndex(null); return }
    const next = [...categories]
    const [moved] = next.splice(dragIndex, 1)
    if (!moved) return
    next.splice(index, 0, moved)
    setDragIndex(null)
    persistOrder(next)
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= categories.length) return
    const next = [...categories]
    const temp = next[index]!
    next[index] = next[target]!
    next[target] = temp
    persistOrder(next)
  }

  if (loading) {
    return (
      <div className="table-wrapper">
        <table className="table">
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                <td style={{ padding: '0.625rem 0.75rem' }}><div className="skeleton" style={{ height: '1.25rem', width: '100%' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input style={{ ...inputStyle, width: '3rem', textAlign: 'center' }} value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="🌵" maxLength={4} />
          <input style={{ ...inputStyle, flex: '1 1 160px' }} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name" />
          <input style={{ ...inputStyle, flex: '2 1 240px' }} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description (optional)" />
          <button className="btn btn-primary btn-sm" onClick={addCategory}>Add</button>
        </div>
      </div>

      {categories.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 0.5rem' }}>
          Drag rows, or use the arrows, to change the order categories appear on the public directory.
        </p>
      )}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Entries</th>
              <th>Order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) =>
              editingId === category.id ? (
                <EditRow key={category.id} category={category} onSave={(fields) => saveCategory(category.id, fields)} onCancel={() => setEditingId(null)} />
              ) : (
                <tr
                  key={category.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index) }}
                  onDrop={() => onDrop(index)}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                  style={{
                    cursor: 'grab',
                    opacity: dragIndex === index ? 0.4 : 1,
                    background: dragOverIndex === index && dragIndex !== index ? 'var(--color-success-subtle)' : undefined,
                  }}
                >
                  <td style={{ fontSize: '1.1rem' }}>{category.icon}</td>
                  <td>
                    <div>{category.name}</div>
                    {category.description && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{category.description}</div>}
                  </td>
                  <td>
                    {category.entryCount > 0 ? (
                      <Link href={`/${adminPath}/m/directory/entries?category=${category.id}`} style={{ color: 'var(--color-primary)' }}>
                        {category.entryCount}
                      </Link>
                    ) : 0}
                  </td>
                  <td onClick={(ev) => ev.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <button type="button" className="btn btn-ghost btn-sm" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
                      <button type="button" className="btn btn-ghost btn-sm" aria-label="Move down" disabled={index === categories.length - 1} onClick={() => move(index, 1)}>↓</button>
                    </div>
                  </td>
                  <td onClick={(ev) => ev.stopPropagation()} style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(category.id)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteCategory(category)}>Delete</button>
                  </td>
                </tr>
              )
            )}
            {categories.length === 0 && (
              <tr><td colSpan={5} style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>No categories yet - add your first one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
