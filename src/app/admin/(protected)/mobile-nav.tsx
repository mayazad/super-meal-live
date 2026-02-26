'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LayoutDashboard, Users, Utensils, ShoppingCart, Zap, Wallet, Landmark, LogOut } from 'lucide-react'

const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Members', href: '/admin/members', icon: Users },
    { name: 'Daily Meals', href: '/admin/meals', icon: Utensils },
    { name: 'Meal Deposits', href: '/admin/meal-deposits', icon: Wallet },
    { name: 'Groceries', href: '/admin/groceries', icon: ShoppingCart },
    { name: 'Utility Deposits', href: '/admin/utility-deposits', icon: Landmark },
    { name: 'Utility Bills', href: '/admin/utilities', icon: Zap },
]

type Props = {
    userEmail: string
}

export default function MobileNav({ userEmail }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    const close = () => setIsOpen(false)

    return (
        <>
            {/* Fixed Top Bar — mobile only */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-background border-b">
                <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                    <div className="h-7 w-7 rounded bg-foreground text-background flex items-center justify-center text-xs font-black">M</div>
                    SuperMeal
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted transition-colors"
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </header>

            {/* Spacer that pushes page content below the fixed header */}
            <div className="lg:hidden h-14" />

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        onClick={close}
                    />
                )}
            </AnimatePresence>

            {/* Slide-over Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="drawer"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                        className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-black text-white flex flex-col shadow-2xl lg:hidden"
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-5 h-14 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-2 font-bold text-lg">
                                <div className="h-7 w-7 rounded bg-white text-black flex items-center justify-center text-xs font-black">M</div>
                                SuperMeal
                            </div>
                            <button
                                onClick={close}
                                className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-white/10 transition-colors"
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Nav Links */}
                        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={close}
                                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[48px] ${isActive
                                                ? 'bg-white text-black'
                                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Drawer Footer */}
                        <div className="shrink-0 border-t border-white/10 p-4 space-y-3">
                            <p className="text-xs text-white/40 truncate px-1">{userEmail}</p>
                            <form action="/admin/logout" method="POST">
                                <button
                                    type="submit"
                                    className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors min-h-[48px]"
                                >
                                    <LogOut className="h-5 w-5 shrink-0" />
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
