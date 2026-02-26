'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Calendar as CalendarIcon, Landmark, User as UserIcon } from 'lucide-react'

type Member = {
    id: string
    name: string
    is_active: boolean
}

type Deposit = {
    id: string
    member_id: string
    date: string
    amount: number
    month_year: string
    members?: { name: string }
}

export default function UtilityDepositsPage() {
    const [deposits, setDeposits] = useState<Deposit[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()

    // Form state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [memberId, setMemberId] = useState('')
    const [amount, setAmount] = useState('')

    // Filter state
    const currentMonthFilter = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const [monthFilter, setMonthFilter] = useState(currentMonthFilter)

    const fetchData = async () => {
        setIsLoading(true)

        const [membersResponse, depositsResponse] = await Promise.all([
            supabase.from('members').select('id, name, is_active').order('name'),
            supabase
                .from('utility_deposits')
                .select(`
                    id, date, amount, month_year, member_id,
                    members (name)
                `)
                .eq('month_year', monthFilter)
                .order('date', { ascending: false })
        ])

        if (membersResponse.data) {
            setMembers(membersResponse.data.filter(m => m.is_active))
        }
        if (depositsResponse.data) {
            setDeposits(depositsResponse.data as unknown as Deposit[])
        }

        setIsLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [monthFilter]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleAddDeposit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!memberId || !amount || isNaN(Number(amount))) return

        setIsSubmitting(true)
        const month_year = date.substring(0, 7)

        const { error } = await supabase
            .from('utility_deposits')
            .insert([{
                member_id: memberId,
                date,
                amount: Number(amount),
                month_year
            }])

        if (!error) {
            setAmount('')
            if (month_year === monthFilter) {
                fetchData()
            }
        } else {
            alert('Failed to save deposit.')
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this deposit entry?')) return

        const { error } = await supabase.from('utility_deposits').delete().eq('id', id)
        if (!error) {
            setDeposits(deposits.filter(d => d.id !== id))
        }
    }

    const totalDeposits = deposits.reduce((sum, item) => sum + Number(item.amount), 0)

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Utility Deposits</h1>
                    <p className="text-muted-foreground mt-1">
                        Log money deposited by members towards the shared Utility Fund.
                    </p>
                </div>

                <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background"
                />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* ADD NEW LOG FORM */}
                <div className="md:col-span-1 border rounded-xl p-6 bg-card text-card-foreground shadow-sm h-fit">
                    <h2 className="font-semibold mb-4 text-lg">Add Deposit</h2>
                    <form onSubmit={handleAddDeposit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Member</label>
                            <select
                                required
                                value={memberId}
                                onChange={(e) => setMemberId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="" disabled>Select a member</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Amount (Tk)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                step="1"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || members.length === 0}
                            className="w-full inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Deposit'}
                        </button>
                    </form>
                </div>

                {/* LOGS LIST */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-xl border">
                        <span className="font-semibold">Total Monthly Deposits</span>
                        <span className="text-xl font-bold">{totalDeposits.toFixed(2)} Tk</span>
                    </div>

                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : deposits.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                <Landmark className="h-10 w-10 mb-2 opacity-20" />
                                No utility deposits recorded for this month.
                            </div>
                        ) : (
                            <div className="divide-y relative">
                                <AnimatePresence>
                                    {deposits.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="p-2 bg-muted rounded-md hidden sm:block">
                                                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{item.members?.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold">{Number(item.amount).toFixed(2)} Tk</span>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-xs text-muted-foreground hover:text-red-500 hover:underline"
                                                >
                                                    Delete
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
        </div>
    )
}
