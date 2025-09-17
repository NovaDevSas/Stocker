import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('app_roles')
    .select('id, name, slug, description, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as any
}

function toSlug(v: string) {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function Roles() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const rolesQ = useQuery({ queryKey: ['app_roles'], queryFn: fetchRoles })

  const [editing, setEditing] = useState<Role | null>(null)

  const form = useForm<{ name: string; slug: string; description?: string }>({
    defaultValues: { name: '', slug: '', description: '' },
  })

  const createMut = useMutation({
    mutationFn: async (values: { name: string; slug: string; description?: string }) => {
      const { error } = await supabase
        .from('app_roles')
        .insert({ name: values.name, slug: values.slug, description: values.description ?? null })
      if (error) throw error
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['app_roles'] })
      form.reset({ name: '', slug: '', description: '' })
    },
  })

  const updateMut = useMutation({
    mutationFn: async (values: { id: string; name: string; slug: string; description?: string }) => {
      const { error } = await supabase
        .from('app_roles')
        .update({ name: values.name, slug: values.slug, description: values.description ?? null })
        .eq('id', values.id)
      if (error) throw error
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['app_roles'] })
      setEditing(null)
      form.reset({ name: '', slug: '', description: '' })
    },
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('app_roles')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['app_roles'] })
    },
  })

  const onSubmit = form.handleSubmit(values => {
    if (!isAdmin) return
    if (editing) {
      updateMut.mutate({ id: editing.id, ...values })
    } else {
      createMut.mutate(values)
    }
  })

  const handleEdit = (r: Role) => {
    setEditing(r)
    form.reset({ name: r.name, slug: r.slug, description: r.description ?? '' })
  }

  const handleCancel = () => {
    setEditing(null)
    form.reset({ name: '', slug: '', description: '' })
  }

  const handleDelete = (r: Role) => {
    if (!isAdmin) return
    const ok = window.confirm(`¿Eliminar el rol "${r.name}"?`)
    if (ok) deleteMut.mutate(r.id)
  }

  const nameWatch = form.watch('name')

  return (
    <div className="px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="mt-1 text-sm text-gray-600">Gestiona los roles de la aplicación. Solo administradores pueden crear, editar o eliminar.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">{editing ? 'Editar rol' : 'Nuevo rol'}</h2>
              {editing && (
                <button onClick={handleCancel} className="text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
              )}
            </div>
            <form className="grid gap-3" onSubmit={onSubmit}>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Nombre</label>
                <input className="rounded-md border px-3 py-2" placeholder="p. ej. Vendedor" {...form.register('name', { required: true })} onBlur={() => {
                  const n = form.getValues('name')
                  const s = form.getValues('slug')
                  if (!s && n) form.setValue('slug', toSlug(n))
                }} />
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Slug</label>
                <input className="rounded-md border px-3 py-2" placeholder="vendedor" {...form.register('slug', { required: true })} />
                <p className="text-xs text-gray-500">Identificador único (minúsculas, sin espacios). Sugerido: {nameWatch ? toSlug(nameWatch) : '—'}</p>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium">Descripción</label>
                <textarea className="rounded-md border px-3 py-2" rows={3} placeholder="Descripción opcional" {...form.register('description')} />
              </div>
              <div className="flex items-center gap-3">
                <button disabled={!isAdmin || createMut.isPending || updateMut.isPending} className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-3 py-2 text-white hover:bg-[var(--brand-700)] disabled:opacity-50">
                  {editing ? (updateMut.isPending ? 'Guardando...' : 'Guardar cambios') : (createMut.isPending ? 'Creando...' : 'Crear rol')}
                </button>
                {editing && (
                  <button type="button" onClick={handleCancel} className="text-sm">Cancelar</button>
                )}
              </div>
              {(createMut as any).error && <p className="text-sm text-red-600">Error: {(createMut as any).error.message}</p>}
              {(updateMut as any).error && <p className="text-sm text-red-600">Error: {(updateMut as any).error.message}</p>}
            </form>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Lista de roles</h2>
              {rolesQ.isRefetching && <span className="text-xs text-gray-500">Actualizando…</span>}
            </div>
            {rolesQ.isLoading ? (
              <div className="py-6 text-sm text-gray-600">Cargando…</div>
            ) : rolesQ.isError ? (
              <div className="py-6 text-sm text-red-600">Error al cargar roles</div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 px-3">Nombre</th>
                      <th className="py-2 px-3">Slug</th>
                      <th className="py-2 px-3">Descripción</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rolesQ.data ?? []).map(r => (
                      <tr key={r.id} className="border-t">
                        <td className="py-2 px-3 font-medium">{r.name}</td>
                        <td className="py-2 px-3"><code className="text-xs bg-gray-100 rounded px-1.5 py-0.5">{r.slug}</code></td>
                        <td className="py-2 px-3 text-gray-600">{r.description}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-3 justify-end">
                            <button disabled={!isAdmin} onClick={() => handleEdit(r)} className="text-[var(--brand-700)] hover:underline disabled:opacity-50">Editar</button>
                            <button disabled={!isAdmin || deleteMut.isPending} onClick={() => handleDelete(r)} className="text-red-600 hover:underline disabled:opacity-50">{deleteMut.isPending ? 'Eliminando…' : 'Eliminar'}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(rolesQ.data ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-500">No hay roles aún.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}