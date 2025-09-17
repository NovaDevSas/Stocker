import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Profile { id: string; display_name: string | null; username: string | null; is_admin: boolean }
interface Role { id: string; name: string; slug: string }
interface Assignment { user_id: string; role_id: string }

async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, is_admin')
    .order('display_name', { ascending: true })
  if (error) throw error
  return data as any
}

async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('app_roles')
    .select('id, name, slug')
    .order('name', { ascending: true })
  if (error) throw error
  return data as any
}

async function fetchAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('app_user_roles')
    .select('user_id, role_id')
  if (error) throw error
  return data as any
}

// Utilidad: convertir archivo a base64 (sin prefijo)
async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buf)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as unknown as number[])
  }
  return btoa(binary)
}

export default function Users() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const profilesQ = useQuery({ queryKey: ['profiles'], queryFn: fetchProfiles })
  const rolesQ = useQuery({ queryKey: ['app_roles'], queryFn: fetchRoles })
  const assignmentsQ = useQuery({ queryKey: ['app_user_roles'], queryFn: fetchAssignments })

  const roleMap = useMemo(() => {
    const map: Record<string, Role> = {}
    ;(rolesQ.data ?? []).forEach(r => { map[r.id] = r })
    return map
  }, [rolesQ.data])

  const assignmentsByUser = useMemo(() => {
    const map: Record<string, string[]> = {}
    ;(assignmentsQ.data ?? []).forEach(a => {
      if (!map[a.user_id]) map[a.user_id] = []
      map[a.user_id].push(a.role_id)
    })
    return map
  }, [assignmentsQ.data])

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, next }: { userId: string; next: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: next })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['profiles'] })
    }
  })

  const addRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from('app_user_roles')
        .insert({ user_id: userId, role_id: roleId })
      if (error) throw error
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['app_user_roles'] })
    }
  })

  const removeRole = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from('app_user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId)
      if (error) throw error
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['app_user_roles'] })
    }
  })

  // Estado de creación
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newIsAdmin, setNewIsAdmin] = useState(false)
  const [newRoleIds, setNewRoleIds] = useState<string[]>([])
  const [newSignature, setNewSignature] = useState<File | null>(null)

  const createUser = useMutation({
    mutationFn: async () => {
      if (!newEmail || !newPassword) throw new Error('Email y contraseña son obligatorios')
      let signature_base64: string | null = null
      if (newSignature) signature_base64 = await fileToBase64(newSignature)
      const { data, error } = await supabase.functions.invoke('create_user', {
        body: {
          email: newEmail,
          password: newPassword,
          display_name: newName || null,
          username: newUsername || null,
          is_admin: newIsAdmin,
          role_ids: newRoleIds,
          signature_base64,
          signature_filename: newSignature?.name ?? null,
        }
      })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: async () => {
      setNewEmail(''); setNewPassword(''); setNewName(''); setNewUsername(''); setNewIsAdmin(false); setNewRoleIds([]); setNewSignature(null)
      await qc.invalidateQueries({ queryKey: ['profiles'] })
      await qc.invalidateQueries({ queryKey: ['app_user_roles'] })
    }
  })

  // Estado de edición
  const [editOpen, setEditOpen] = useState(false)
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editIsAdmin, setEditIsAdmin] = useState(false)
  const [editRoleIds, setEditRoleIds] = useState<string[]>([])
  const [editPassword, setEditPassword] = useState('')
  const [editSignature, setEditSignature] = useState<File | null>(null)

  const updateUser = useMutation({
    mutationFn: async () => {
      if (!editUserId) throw new Error('Sin usuario a editar')
      let signature_base64: string | null = null
      if (editSignature) signature_base64 = await fileToBase64(editSignature)
      const { error } = await supabase.functions.invoke('update_user', {
        body: {
          user_id: editUserId,
          display_name: editName,
          username: editUsername,
          is_admin: editIsAdmin,
          role_ids: editRoleIds,
          reset_password: editPassword || null,
          signature_base64,
          signature_filename: editSignature?.name ?? null,
        }
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: async () => {
      setEditOpen(false); setEditUserId(null); setEditPassword(''); setEditSignature(null)
      await qc.invalidateQueries({ queryKey: ['profiles'] })
      await qc.invalidateQueries({ queryKey: ['app_user_roles'] })
    }
  })

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.functions.invoke('delete_user', { body: { user_id: userId } })
      if (error) throw new Error(error.message)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['profiles'] })
      await qc.invalidateQueries({ queryKey: ['app_user_roles'] })
    }
  })

  const openEdit = (p: Profile) => {
    setEditUserId(p.id)
    setEditName(p.display_name ?? '')
    setEditUsername(p.username ?? '')
    setEditIsAdmin(!!p.is_admin)
    setEditRoleIds(assignmentsByUser[p.id] ?? [])
    setEditPassword('')
    setEditSignature(null)
    setEditOpen(true)
  }
  return (
    <div className="px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios y roles</h1>
          <p className="mt-1 text-sm text-gray-600">Asigna roles y gestiona el flag administrador. Solo administradores pueden modificar.</p>
        </div>

        {isAdmin && (
          <div className="mb-6 rounded-xl border bg-white p-4">
            <h2 className="font-medium mb-3">Crear usuario</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input className="w-full rounded-md border px-3 py-2" type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="correo@ejemplo.com" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Contraseña</label>
                <input className="w-full rounded-md border px-3 py-2" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="mín. 6 caracteres" />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={newIsAdmin} onChange={e=>setNewIsAdmin(e.target.checked)} />
                  <span>Admin</span>
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                <input className="w-full rounded-md border px-3 py-2" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nombre para mostrar" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Usuario</label>
                <input className="w-full rounded-md border px-3 py-2" value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="username (opcional)" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Foto / Firma</label>
                <input className="w-full" type="file" accept="image/*" onChange={e=>setNewSignature(e.target.files?.[0] ?? null)} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs text-gray-600 mb-1">Roles</label>
                <div className="flex flex-wrap gap-3">
                  {(rolesQ.data ?? []).map(r => {
                    const checked = newRoleIds.includes(r.id)
                    return (
                      <label key={r.id} className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={checked} onChange={(e)=>{
                          setNewRoleIds(prev=> e.target.checked ? [...prev, r.id] : prev.filter(x=>x!==r.id))
                        }} />
                        <span>{r.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-3 py-1.5 text-white hover:bg-[var(--brand-700)] disabled:opacity-50" disabled={createUser.isPending} onClick={()=>createUser.mutate()}>
                {createUser.isPending ? 'Creando…' : 'Crear usuario'}
              </button>
              {createUser.isError && <span className="text-sm text-red-600">{(createUser.error as any)?.message ?? 'Error'}</span>}
            </div>
          </div>
        )}

        {profilesQ.isLoading || rolesQ.isLoading || assignmentsQ.isLoading ? (
          <div className="text-sm text-gray-600">Cargando…</div>
        ) : (profilesQ.isError || rolesQ.isError || assignmentsQ.isError) ? (
          <div className="text-sm text-red-600">Error al cargar datos</div>
        ) : (
          <div className="rounded-xl border bg-white p-4 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 px-3">Nombre</th>
                  <th className="py-2 px-3">Usuario</th>
                  <th className="py-2 px-3">Admin</th>
                  <th className="py-2 px-3">Roles</th>
                  <th className="py-2 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(profilesQ.data ?? []).map(p => {
                  const assigned = assignmentsByUser[p.id] ?? []
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 px-3">{p.display_name ?? p.username ?? '—'}</td>
                      <td className="py-2 px-3 text-gray-600">{p.username}</td>
                      <td className="py-2 px-3">
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input type="checkbox" disabled={!isAdmin || toggleAdmin.isPending} checked={!!p.is_admin} onChange={(e) => toggleAdmin.mutate({ userId: p.id, next: e.target.checked })} />
                          <span>{p.is_admin ? 'Sí' : 'No'}</span>
                        </label>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-2">
                          {assigned.map(roleId => (
                            <span key={roleId} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                              <span>{roleMap[roleId]?.name ?? roleId}</span>
                              <button disabled={!isAdmin || removeRole.isPending} className="text-gray-500 hover:text-red-600" onClick={() => removeRole.mutate({ userId: p.id, roleId })}>
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2 justify-end">
                          <select className="rounded-md border px-2 py-1" disabled={!isAdmin || addRole.isPending} onChange={(e) => {
                            const val = e.target.value
                            if (!val) return
                            addRole.mutate({ userId: p.id, roleId: val })
                            e.currentTarget.value = ''
                          }}>
                            <option value="">Añadir rol…</option>
                            {(rolesQ.data ?? []).filter(r => !(assignmentsByUser[p.id] ?? []).includes(r.id)).map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          {isAdmin && (
                            <>
                              <button className="rounded-md border px-2 py-1 hover:bg-gray-50" onClick={()=>openEdit(p)}>Editar</button>
                              <button className="rounded-md border px-2 py-1 text-red-600 hover:bg-red-50" onClick={()=>{ if (confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) deleteUser.mutate(p.id) }}>Eliminar</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(profilesQ.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">No hay usuarios aún.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de edición */}
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Editar usuario</h3>
                <button className="text-gray-500" onClick={()=>setEditOpen(false)}>×</button>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                  <input className="w-full rounded-md border px-3 py-2" value={editName} onChange={e=>setEditName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Usuario</label>
                  <input className="w-full rounded-md border px-3 py-2" value={editUsername} onChange={e=>setEditUsername(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editIsAdmin} onChange={e=>setEditIsAdmin(e.target.checked)} />
                    <span>Admin</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nueva contraseña</label>
                  <input className="w-full rounded-md border px-3 py-2" type="password" value={editPassword} onChange={e=>setEditPassword(e.target.value)} placeholder="opcional" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Foto / Firma</label>
                  <input className="w-full" type="file" accept="image/*" onChange={e=>setEditSignature(e.target.files?.[0] ?? null)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-600 mb-1">Roles</label>
                  <div className="flex flex-wrap gap-3">
                    {(rolesQ.data ?? []).map(r => {
                      const checked = editRoleIds.includes(r.id)
                      return (
                        <label key={r.id} className="inline-flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={checked} onChange={(e)=>{
                            setEditRoleIds(prev=> e.target.checked ? [...prev, r.id] : prev.filter(x=>x!==r.id))
                          }} />
                          <span>{r.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-3">
                <button className="rounded-md border px-3 py-1.5" onClick={()=>setEditOpen(false)}>Cancelar</button>
                <button className="inline-flex items-center rounded-md bg-[var(--brand-600)] px-3 py-1.5 text-white hover:bg-[var(--brand-700)] disabled:opacity-50" disabled={updateUser.isPending} onClick={()=>updateUser.mutate()}>
                  {updateUser.isPending ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}