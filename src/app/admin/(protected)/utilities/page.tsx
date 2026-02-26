'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Zap, CheckCircle2, Circle } from 'lucide-react'

type Utility = {
    id: string
    type: string
    cost: number
    month_year: string
    due_date?: string
}

type Member = {
    id: string
    name: string
}

type PaymentKey = `${string}:${string}` // `${utility_id}:${member_id}`

export default function UtilitiesPage() {
    const [utilities, setUtilities] = useState<Utility[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [payments, setPayments] = useState<Set<PaymentKey>>(new Set())
    const [toggling, setToggling] = useState<PaymentKey | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<Record<string, boolean>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()

    const [type, setType] = useState('')
    const [cost, setCost] = useState('')
    const [dueDate, setDueDate] = useState('')

    const currentMonthFilter = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const [monthFilter, setMonthFilter] = useState(currentMonthFilter)

    const fetchAll = async () => {
        setIsLoading(true)

        const [
            { data: utilitiesData },
            { data: membersData },
            { data: paymentsData },
        ] = await Promise.all([
            supabase.from('utilities').select('*').eq('month_year', monthFilter).order('created_at', { ascending: true }),
            supabase.from('members').select('id, name').eq('is_active', true).order('name'),
            supabase.from('utility_payments').select('utility_id, member_id, paid'),
        ])

        setUtilities(utilitiesData || [])
        setMembers(membersData || [])

        // Build a Set of "utility_id:member_id" for paid entries
        const paidSet = new Set<PaymentKey>()
            ; (paymentsData || []).forEach(p => {
                if (p.paid) paidSet.add(`${p.utility_id}:${p.member_id}`)
            })
        setPayments(paidSet)

        setIsLoading(false)
    }

    useEffect(() => {
        fetchAll()
    }, [monthFilter]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleAddUtility = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!type.trim() || !cost || isNaN(Number(cost))) return
        setIsSubmitting(true)

        const payload: Record<string, unknown> = {
            type: type.trim(),
            cost: Number(cost),
            month_year: monthFilter,
        }
        if (dueDate) payload.due_date = dueDate

        const { error } = await supabase.from('utilities').insert([payload])
        if (!error) {
            setType('')
            setCost('')
            setDueDate('')
            fetchAll()
        }
        setIsSubmitting(false)
    }

    const handleDeleteClick = (id: string) => {
        if (deleteConfirm[id]) {
            handleDeleteConfirmed(id)
        } else {
            setDeleteConfirm(prev => ({ ...prev, [id]: true }))
            setTimeout(() => setDeleteConfirm(prev => ({ ...prev, [id]: false })), 3000)
        }
    }

    const handleDeleteConfirmed = async (id: string) => {
        const { error } = await supabase.from('utilities').delete().eq('id', id)
        if (!error) fetchAll()
        setDeleteConfirm(prev => ({ ...prev, [id]: false }))
    }

    const handleToggle = async (utilityId: string, memberId: string) => {
        const key: PaymentKey = `${utilityId}:${memberId}`
        const isPaid = payments.has(key)
        setToggling(key)

        // Optimistic update
        setPayments(prev => {
            const next = new Set(prev)
            if (isPaid) next.delete(key)
            else next.add(key)
            return next
        })

        const { error } = await supabase
            .from('utility_payments')
            .upsert(
                [{ utility_id: utilityId, member_id: memberId, paid: !isPaid }],
                { onConflict: 'utility_id,member_id' }
            )

        if (error) {
            // Revert on error
            setPayments(prev => {
                const next = new Set(prev)
                if (isPaid) next.add(key)
                else next.delete(key)
                return next
            })
        }
        setToggling(null)
    }

    const totalCost = utilities.reduce((sum, item) => sum + Number(item.cost), 0)

    return (
        <div className="space-y-8 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Utilities</h1>
                    <p className="text-muted-foreground mt-1">Log bills and track who has paid.</p>
                </div>
                <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
            </div>

            {/* Add Bill + Bill List */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* Form */}
                <div className="md:col-span-1 border rounded-xl p-6 bg-card shadow-sm h-fit">
                    <h2 className="font-semibold mb-4 text-lg">Add Bill ({monthFilter})</h2>
                    <form onSubmit={handleAddUtility} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type (e.g., Wi-Fi)</label>
                            <input
                                type="text" required placeholder="Electricity"
                                value={type} onChange={(e) => setType(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cost (Tk)</label>
                            <input
                                type="number" required min="0.01" step="0.01" placeholder="0.00"
                                value={cost} onChange={(e) => setCost(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Due Date (Optional)</label>
                            <input
                                type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            />
                        </div>
                        <button
                            type="submit" disabled={isSubmitting}
                            className="w-full inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Bill'}
                        </button>
                    </form>
                </div>

                {/* Bill list */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-xl border">
                        <span className="font-semibold">Total Utility Expenses</span>
                        <span className="text-xl font-bold">{totalCost.toFixed(2)} Tk</span>
                    </div>

                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : utilities.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                <Zap className="h-10 w-10 mb-2 opacity-20" />
                                No utility bills added for this month.
                            </div>
                        ) : (
                            <div className="divide-y relative">
                                <AnimatePresence>
                                    {utilities.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <div>
                                                <p className="font-semibold">{item.type}</p>
                                                {item.due_date && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Due: {new Date(item.due_date).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold">{Number(item.cost).toFixed(2)} Tk</span>
                                                <button
                                                    onClick={() => handleDeleteClick(item.id)}
                                                    className={`text-xs font-medium transition-colors ${deleteConfirm[item.id] ? 'text-red-500 font-bold border border-red-400 rounded-md px-2 py-0.5' : 'text-muted-foreground hover:text-red-500 hover:underline'}`}
                                                >
                                                    {deleteConfirm[item.id] ? 'Confirm?' : 'Delete'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Matrix */}
            {!isLoading && utilities.length > 0 && members.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Payment Matrix</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Toggle to mark each member as paid for a specific bill.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="text-left p-4 font-semibold min-w-[160px]">Bill</th>
                                    <th className="p-4 font-semibold text-center text-muted-foreground text-xs">Cost/person</th>
                                    {members.map(m => (
                                        <th key={m.id} className="p-4 font-semibold text-center min-w-[100px]">
                                            {m.name.split(' ')[0]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {utilities.map(bill => {
                                    const perPerson = members.length > 0 ? Number(bill.cost) / members.length : 0
                                    return (
                                        <tr key={bill.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-4">
                                                <p className="font-medium">{bill.type}</p>
                                                <p className="text-xs text-muted-foreground">{Number(bill.cost).toFixed(2)} Tk total</p>
                                            </td>
                                            <td className="p-4 text-center text-xs text-muted-foreground">
                                                {perPerson.toFixed(2)} Tk
                                            </td>
                                            {members.map(member => {
                                                const key: PaymentKey = `${bill.id}:${member.id}`
                                                const isPaid = payments.has(key)
                                                const isTogglingThis = toggling === key

                                                return (
                                                    <td key={member.id} className="p-4 text-center">
                                                        <button
                                                            onClick={() => handleToggle(bill.id, member.id)}
                                                            disabled={isTogglingThis}
                                                            className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all ${isPaid
                                                                ? 'bg-foreground text-background'
                                                                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                                                } disabled:opacity-50`}
                                                            title={isPaid ? `${member.name} has paid` : `Mark ${member.name} as paid`}
                                                        >
                                                            {isTogglingThis ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : isPaid ? (
                                                                <CheckCircle2 className="h-5 w-5" />
                                                            ) : (
                                                                <Circle className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                            <tfoot className="border-t bg-muted/20">
                                <tr>
                                    <td className="p-4 font-semibold text-sm">Paid Summary</td>
                                    <td className="p-4" />
                                    {members.map(member => {
                                        const paidCount = utilities.filter(b => payments.has(`${b.id}:${member.id}`)).length
                                        return (
                                            <td key={member.id} className="p-4 text-center">
                                                <span className={`text-xs font-semibold ${paidCount === utilities.length ? 'text-green-500' : 'text-muted-foreground'}`}>
                                                    {paidCount}/{utilities.length}
                                                </span>
                                            </td>
                                        )
                                    })}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
