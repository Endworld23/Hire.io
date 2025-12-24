'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button, Input } from '@/components/ui'
import { createCandidate, listCandidatesForTenant, updateCandidate } from '@/lib/actions/candidates'

type CandidateRow = {
  id: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  created_at?: string | null
}

type CandidateForm = {
  full_name: string
  email: string
  phone: string
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, startSubmit] = useTransition()
  const [form, setForm] = useState<CandidateForm>({ full_name: '', email: '', phone: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CandidateForm>({ full_name: '', email: '', phone: '' })

  useEffect(() => {
    ;(async () => {
      const result = await listCandidatesForTenant()
      if (result.error) {
        setError(result.error)
      }
      setCandidates(result.candidates || [])
      setIsLoading(false)
    })()
  }, [])

  const handleCreate = () => {
    setError(null)
    startSubmit(async () => {
      const result = await createCandidate({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.candidate) {
        setCandidates(prev => [result.candidate as CandidateRow, ...prev])
        setForm({ full_name: '', email: '', phone: '' })
      }
    })
  }

  const startEdit = (candidate: CandidateRow) => {
    setEditId(candidate.id)
    setEditForm({
      full_name: candidate.full_name || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
    })
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditForm({ full_name: '', email: '', phone: '' })
  }

  const handleUpdate = (candidateId: string) => {
    setError(null)
    startSubmit(async () => {
      const result = await updateCandidate(candidateId, {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.candidate) {
        setCandidates(prev =>
          prev.map(candidate =>
            candidate.id === candidateId ? (result.candidate as CandidateRow) : candidate
          )
        )
        cancelEdit()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add and manage candidates for your tenant.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add Candidate</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-800">Full name</label>
            <Input
              value={form.full_name}
              onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">Phone (optional)</label>
            <Input
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Add Candidate'}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Candidate List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-500" colSpan={4}>
                    Loading candidates…
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-500" colSpan={4}>
                    No candidates yet.
                  </td>
                </tr>
              ) : (
                candidates.map(candidate => (
                  <tr key={candidate.id}>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {editId === candidate.id ? (
                        <Input
                          value={editForm.full_name}
                          onChange={e =>
                            setEditForm(prev => ({ ...prev, full_name: e.target.value }))
                          }
                        />
                      ) : (
                        candidate.full_name || '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {editId === candidate.id ? (
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={e =>
                            setEditForm(prev => ({ ...prev, email: e.target.value }))
                          }
                        />
                      ) : (
                        candidate.email || '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {candidate.created_at
                        ? new Date(candidate.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {editId === candidate.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={cancelEdit}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleUpdate(candidate.id)}
                            disabled={isSubmitting}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" onClick={() => startEdit(candidate)}>
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
