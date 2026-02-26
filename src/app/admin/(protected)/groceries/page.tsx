'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Calendar as CalendarIcon, ShoppingBag, User as UserIcon, Trash2 } from 'lucide-react'

type Member = { id: string; name: string }

type Grocery = {
    id: string
    date: string
    item_name: string
    cost: number
    month_year: string
    purchased_by: string | null
}

export default function GroceriesPage() {
    const [groceries, setGroceries] = useState<Grocery[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    // Per-row delete confirmation state: id → 'idle' | 'confirm'
    const [deleteConfirm, setDeleteConfirm] = useState<Record<string, boolean>>({})

    const supabase = createClient()

    // Form state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [itemName, setItemName] = useState('')
    const [cost, setCost] = useState('')
    const [purchasedBy, setPurchasedBy] = useState<string>('')

    const currentMonthFilter = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const [monthFilter, setMonthFilter] = useState(currentMonthFilter)

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        const [{ data: groceryData }, { data: memberData }] = await Promise.all([
            supabase.from('groceries').select('*').eq('month_year', monthFilter).order('date', { ascending: false }),
            supabase.from('members').select('id, name').eq('is_active', true).order('name'),
        ])
        setGroceries(groceryData || [])
        setMembers(memberData || [])
        // Default purchasedBy to first member if not set
        if (memberData && memberData.length > 0 && !purchasedBy) {
            setPurchasedBy(memberData[0].id)
        }
        setIsLoading(false)
    }, [monthFilter]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchData() }, [fetchData])

    const handleAddGrocery = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!itemName.trim() || !cost || isNaN(Number(cost))) return
        setIsSubmitting(true)

        const month_year = date.substring(0, 7)
        const costNum = Number(cost)

        // 1. Insert grocery record
        const { data: groceryRow, error: groceryErr } = await supabase
            .from('groceries')
            .insert([{ date, item_name: itemName.trim(), cost: costNum, month_year, purchased_by: purchasedBy || null }])
            .select()
            .single()

        if (groceryErr || !groceryRow) {
            console.error(groceryErr)
            setIsSubmitting(false)
            return
        }

        // 2. ── Bazaar-to-Balance: auto-credit the buyer in meal_deposits ──────
        if (purchasedBy) {
            const { error: depositErr } = await supabase
                .from('meal_deposits')
                .insert([{
                    member_id: purchasedBy,
                    amount: costNum,
                    month_year,
                    date,
                    note: `Auto-credit: ${itemName.trim()}`,
                }])
            if (depositErr) console.error('Auto-deposit failed:', depositErr)
        }

        setItemName('')
        setCost('')
        if (month_year === monthFilter) fetchData()
        setIsSubmitting(false)
    }

    const handleDeleteClick = (id: string) => {
        if (deleteConfirm[id]) {
            // Second click — actually delete
            handleDeleteConfirmed(id)
        } else {
            // First click — enter confirm state, auto-reset after 3s
            setDeleteConfirm(prev => ({ ...prev, [id]: true }))
            setTimeout(() => setDeleteConfirm(prev => ({ ...prev, [id]: false })), 3000)
        }
    }

    const handleDeleteConfirmed = async (id: string) => {
        const { error } = await supabase.from('groceries').delete().eq('id', id)
        if (!error) {
            setGroceries(prev => prev.filter(g => g.id !== id))
        }
        setDeleteConfirm(prev => ({ ...prev, [id]: false }))
    }

    const getMemberName = (id: string | null) => members.find(m => m.id === id)?.name ?? null
    const totalCost = groceries.reduce((sum, item) => sum + Number(item.cost), 0)

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Groceries</h1>
                    <p className="text-muted-foreground mt-1">Log shared bazaar and grocery expenses.</p>
                </div>
                <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* ADD FORM */}
                <div className="md:col-span-1 border rounded-xl p-6 bg-card shadow-sm h-fit space-y-4">
                    <h2 className="font-semibold text-lg">Add Record</h2>
                    <form onSubmit={handleAddGrocery} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Item / Description</label>
                            <input type="text" required placeholder="e.g. Weekly Bazaar" value={itemName} onChange={e => setItemName(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Total Cost (Tk)</label>
                            <input type="number" required min="0.01" step="0.01" placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                        </div>

                        {/* Bazaar-to-Balance: who paid? */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-1">
                                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                Paid By (auto-credits meal fund)
                            </label>
                            <select value={purchasedBy} onChange={e => setPurchasedBy(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">— No credit (shared pool) —</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            {purchasedBy && (
                                <p className="text-[11px] text-muted-foreground">
                                    ✓ {getMemberName(purchasedBy)} will receive a <strong>{cost || '–'} Tk</strong> meal deposit automatically.
                                </p>
                            )}
                        </div>

                        <button type="submit" disabled={isSubmitting}
                            className="w-full inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Record'}
                        </button>
                    </form>
                </div>

                {/* LIST */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-xl border">
                        <span className="font-semibold">Monthly Total</span>
                        <span className="text-xl font-bold">{totalCost.toFixed(2)} Tk</span>
                    </div>

                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : groceries.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                                <ShoppingBag className="h-10 w-10 opacity-20" />
                                <p className="text-sm font-medium">No groceries for {monthFilter}.</p>
                                <p className="text-xs">Add the first bazaar record using the form.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                <AnimatePresence>
                                    {groceries.map(item => {
                                        const buyer = getMemberName(item.purchased_by)
                                        const inConfirm = deleteConfirm[item.id]
                                        return (
                                            <motion.div key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors gap-4"
                                            >
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className="p-2 bg-muted rounded-md hidden sm:flex shrink-0">
                                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold truncate">{item.item_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(item.date + 'T00:00:00').toLocaleDateString()}
                                                            {buyer && <span className="ml-2 text-foreground/60">· Paid by <span className="font-medium">{buyer}</span> ↗ auto-credit</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="font-bold">{Number(item.cost).toFixed(2)} Tk</span>
                                                    <AnimatePresence mode="wait">
                                                        {inConfirm ? (
                                                            <motion.button
                                                                key="confirm"
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0 }}
                                                                onClick={() => handleDeleteClick(item.id)}
                                                                className="text-xs font-bold text-red-500 border border-red-400 rounded-md px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                            >
                                                                Confirm?
                                                            </motion.button>
                                                        ) : (
                                                            <motion.button
                                                                key="delete"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                                onClick={() => handleDeleteClick(item.id)}
                                                                className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </motion.button>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/50 text-center tracking-wide pb-1">
                        Grocery Ledger · <span className="font-mono font-semibold">MayazAD</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
