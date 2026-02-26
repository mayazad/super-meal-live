'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Save, User as UserIcon, Minus, Plus, BookOpen } from 'lucide-react'

type Member = { id: string; name: string }

type LedgerRow = {
    id: string
    date: string
    member_id: string
    regular_meals: number
    guest_meals: number
    created_at: string
}

export default function MealsPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [meals, setMeals] = useState<Record<string, { regular: number; guest: number }>>({})
    const [ledger, setLedger] = useState<LedgerRow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingLedger, setIsLoadingLedger] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    const [dateFilter, setDateFilter] = useState(today)

    // month_year derived from dateFilter — drives both Save and the history table
    const monthYear = dateFilter.substring(0, 7)

    // ── Fetch members + counters for the selected date ──────────────────────────
    const fetchData = useCallback(async () => {
        setIsLoading(true)
        const [{ data: membersData }, { data: mealsData }] = await Promise.all([
            supabase.from('members').select('id, name').eq('is_active', true).order('name'),
            supabase.from('daily_meals')
                .select('member_id, regular_meals, guest_meals')
                .eq('date', dateFilter),
        ])

        const mems = membersData || []
        setMembers(mems)

        const mealMap: Record<string, { regular: number; guest: number }> = {}
        mems.forEach(m => {
            const rec = mealsData?.find(r => r.member_id === m.id)
            mealMap[m.id] = rec ? { regular: rec.regular_meals, guest: rec.guest_meals } : { regular: 0, guest: 0 }
        })
        setMeals(mealMap)
        setIsLoading(false)
    }, [dateFilter]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Fetch monthly history for the ledger table ───────────────────────────────
    const fetchLedger = useCallback(async () => {
        setIsLoadingLedger(true)
        const { data } = await supabase
            .from('daily_meals')
            .select('id, date, member_id, regular_meals, guest_meals, created_at')
            .eq('month_year', monthYear)
            .order('date', { ascending: false })
        setLedger(data || [])
        setIsLoadingLedger(false)
    }, [monthYear]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchData() }, [fetchData])
    useEffect(() => { fetchLedger() }, [fetchLedger])

    // ── Supabase Realtime — update history table without page refresh ─────────────
    useEffect(() => {
        const channel = supabase
            .channel('daily_meals_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_meals' }, () => {
                fetchLedger()
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [fetchLedger]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleMealChange = (memberId: string, type: 'regular' | 'guest', inc: number) => {
        const cur = meals[memberId] || { regular: 0, guest: 0 }
        setMeals({ ...meals, [memberId]: { ...cur, [type]: Math.max(0, cur[type] + inc) } })
    }

    // ── Save — upsert so corrections are always possible ─────────────────────────
    const handleSaveAll = async () => {
        setIsSubmitting(true)
        const payload = members.map(m => ({
            member_id: m.id,
            date: dateFilter,
            month_year: monthYear,
            regular_meals: meals[m.id]?.regular || 0,
            guest_meals: meals[m.id]?.guest || 0,
        }))

        const { error } = await supabase
            .from('daily_meals')
            .upsert(payload, { onConflict: 'member_id,date' })

        if (error) {
            console.error(error)
            alert('Failed to save. Try again.')
        } else {
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 2500)
            // Ledger will auto-refresh via Realtime, but also fetch immediately
            fetchLedger()
        }
        setIsSubmitting(false)
    }

    const getMemberName = (id: string) => members.find(m => m.id === id)?.name ?? '—'
    const totalMealsToday = Object.values(meals).reduce((s, c) => s + c.regular + c.guest, 0)

    // Totals for the ledger footer
    const ledgerTotalRegular = ledger.reduce((s, r) => s + r.regular_meals, 0)
    const ledgerTotalGuest = ledger.reduce((s, r) => s + r.guest_meals, 0)

    return (
        <div className="space-y-10 max-w-4xl">

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Daily Meals</h1>
                    <p className="text-muted-foreground mt-1">Log daily regular and guest meals per roommate.</p>
                </div>
                <div className="flex items-center border border-input rounded-md px-3 bg-background">
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="flex h-10 min-w-[160px] bg-transparent text-sm focus-visible:outline-none"
                    />
                </div>
            </div>

            {/* ── Meal Counters ────────────────────────────────────────────── */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex justify-between items-center bg-muted/50 p-4 border-b">
                    <span className="font-semibold">Meals on {dateFilter}</span>
                    <span className="text-xl font-bold">{totalMealsToday} total</span>
                </div>

                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : members.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                        <UserIcon className="h-10 w-10 mb-2 opacity-20" />
                        No active members. Add members first.
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <AnimatePresence>
                                {members.map((member) => (
                                    <motion.div
                                        key={member.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col space-y-3 p-4 border rounded-lg bg-background"
                                    >
                                        <div className="flex items-center gap-2 font-medium">
                                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                                            {member.name}
                                        </div>

                                        {(['regular', 'guest'] as const).map(type => (
                                            <div key={type} className="flex items-center justify-between border rounded-md p-1 bg-muted/10">
                                                <span className="text-xs font-medium w-14 text-center capitalize">{type}</span>
                                                <button
                                                    onClick={() => handleMealChange(member.id, type, -1)}
                                                    disabled={(meals[member.id]?.[type] || 0) === 0}
                                                    className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="text-lg font-bold w-8 text-center">{meals[member.id]?.[type] || 0}</span>
                                                <button
                                                    onClick={() => handleMealChange(member.id, type, 1)}
                                                    className="p-2 hover:bg-muted rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Save row */}
                        <div className="mt-8 flex items-center justify-end gap-4">
                            <AnimatePresence>
                                {saveSuccess && (
                                    <motion.span
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="text-sm font-medium text-green-600"
                                    >
                                        ✓ Saved
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={handleSaveAll}
                                disabled={isSubmitting}
                                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save All Changes
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Monthly History Ledger ───────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-xl font-bold tracking-tight">Monthly History</h2>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground uppercase tracking-wide">
                            {monthYear}
                        </span>
                        <span className="text-xs bg-foreground text-background px-2 py-0.5 rounded-full font-medium">Live</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{ledger.length} records</p>
                </div>

                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    {isLoadingLedger ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : ledger.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <BookOpen className="h-8 w-8 opacity-20 mx-auto mb-2" />
                            <p className="text-sm">No meal records for {monthYear}.</p>
                            <p className="text-xs mt-1">Log meals above and save to build history.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="text-left p-3 pl-4 font-semibold">Date</th>
                                        <th className="text-left p-3 font-semibold">Member</th>
                                        <th className="text-center p-3 font-semibold">Regular</th>
                                        <th className="text-center p-3 font-semibold">Guest</th>
                                        <th className="text-center p-3 pr-4 font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <AnimatePresence initial={false}>
                                        {ledger.map(row => (
                                            <motion.tr
                                                key={row.id}
                                                initial={{ opacity: 0, backgroundColor: 'oklch(0.9 0 0 / 0.12)' }}
                                                animate={{ opacity: 1, backgroundColor: 'oklch(0 0 0 / 0)' }}
                                                transition={{ duration: 0.6 }}
                                                className="hover:bg-muted/20 transition-colors"
                                            >
                                                <td className="p-3 pl-4 font-mono text-xs text-muted-foreground">{row.date}</td>
                                                <td className="p-3 font-medium">{getMemberName(row.member_id)}</td>
                                                <td className="p-3 text-center">{row.regular_meals}</td>
                                                <td className="p-3 text-center text-muted-foreground">{row.guest_meals}</td>
                                                <td className="p-3 pr-4 text-center font-semibold">
                                                    {row.regular_meals + row.guest_meals}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                                <tfoot className="border-t bg-muted/30">
                                    <tr>
                                        <td colSpan={2} className="p-3 pl-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                            Month Totals
                                        </td>
                                        <td className="p-3 text-center font-bold">{ledgerTotalRegular}</td>
                                        <td className="p-3 text-center font-bold text-muted-foreground">{ledgerTotalGuest}</td>
                                        <td className="p-3 pr-4 text-center font-bold">{ledgerTotalRegular + ledgerTotalGuest}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5} className="px-4 pb-3 pt-1">
                                            <p className="text-[11px] text-muted-foreground/50 tracking-wide">
                                                Meal Ledger · SuperMeal · Crafted by <span className="font-mono font-semibold">MayazAD</span>
                                            </p>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}
