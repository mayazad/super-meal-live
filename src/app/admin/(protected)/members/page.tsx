'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Loader2 } from 'lucide-react'

type Member = {
    id: string
    name: string
    is_active: boolean
    created_at: string
}

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [newMemberName, setNewMemberName] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()

    const fetchMembers = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('created_at', { ascending: true })

        if (!error && data) {
            setMembers(data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchMembers()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMemberName.trim()) return

        setIsSubmitting(true)
        const { data, error } = await supabase
            .from('members')
            .insert([{ name: newMemberName.trim(), is_active: true }])
            .select()

        if (!error && data) {
            setMembers([...members, data[0]])
            setNewMemberName('')
        }
        setIsSubmitting(false)
    }

    const handleDeleteMember = async (id: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return

        // We update is_active to false rather than hard delete to preserve historical meal data
        const { error } = await supabase
            .from('members')
            .update({ is_active: false })
            .eq('id', id)

        if (!error) {
            setMembers(members.map(m => m.id === id ? { ...m, is_active: false } : m))
        }
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                <p className="text-muted-foreground mt-1">
                    Manage roommates and their active status.
                </p>
            </div>

            <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                    type="text"
                    placeholder="New roommate name..."
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={isSubmitting || !newMemberName.trim()}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    {isSubmitting ? '' : 'Add'}
                </button>
            </form>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : members.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No members found. Add your first roommate above.
                    </div>
                ) : (
                    <div className="divide-y relative">
                        <AnimatePresence>
                            {members.map((member) => (
                                <motion.div
                                    key={member.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: member.is_active ? 1 : 0.5, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex items-center justify-between p-4 ${!member.is_active && 'bg-muted/50'}`}
                                >
                                    <div>
                                        <p className="font-medium flex items-center gap-2">
                                            {member.name}
                                            {!member.is_active && (
                                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full border">Inactive</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Added {new Date(member.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {member.is_active && (
                                        <button
                                            onClick={() => handleDeleteMember(member.id)}
                                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                            title="Deactivate Member"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}
