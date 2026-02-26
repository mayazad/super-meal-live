'use client'

import { useState, useEffect } from 'react'
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

    // ── Scroll-lock: freeze body scroll while drawer is open ──────────────────
    useEffect(() => {
        if (isOpen) {
            const scrollY = window.scrollY
            document.body.style.position = 'fixed'
            document.body.style.top = `-${scrollY}px`
            document.body.style.left = '0'
            document.body.style.right = '0'
            document.body.style.overflow = 'hidden'
        } else {
            const scrollY = parseInt(document.body.style.top || '0') * -1
            document.body.style.position = ''
            document.body.style.top = ''
            document.body.style.left = ''
            document.body.style.right = ''
            document.body.style.overflow = ''
            window.scrollTo(0, scrollY)
        }
        return () => {
            document.body.style.position = ''
            document.body.style.top = ''
            document.body.style.left = ''
            document.body.style.right = ''
            document.body.style.overflow = ''
        }
    }, [isOpen])

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
                        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm lg:hidden"
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
                        className="fixed top-0 left-0 bottom-0 z-[100] w-72 flex flex-col shadow-2xl lg:hidden"
                        style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', overscrollBehavior: 'contain' }}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-5 h-14 shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
                            <div className="flex items-center gap-2 font-bold text-lg">
                                <div className="h-7 w-7 rounded flex items-center justify-center text-xs font-black"
                                    style={{ background: 'var(--sidebar-active-bg)', color: 'var(--sidebar-active-text)' }}>M</div>
                                SuperMeal
                            </div>
                            <button
                                onClick={close}
                                className="flex items-center justify-center h-10 w-10 rounded-md transition-colors"
                                style={{ color: 'var(--sidebar-muted)' }}
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Nav Links */}
                        <nav className="flex-1 overflow-y-auto overscroll-contain py-4 px-3 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={close}
                                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[48px]"
                                        style={isActive
                                            ? { background: 'var(--sidebar-active-bg)', color: 'var(--sidebar-active-text)' }
                                            : { color: 'var(--sidebar-muted)' }
                                        }
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Drawer Footer */}
                        <div className="shrink-0 p-4 space-y-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
                            <p className="text-xs truncate px-1" style={{ color: 'var(--sidebar-muted)' }}>{userEmail}</p>
                            <p className="text-[10px] px-1 tracking-wide brand-glow" style={{ opacity: 0.5 }}>
                                Crafted by <span className="font-mono font-semibold">MayazAD</span>
                            </p>
                            <form action="/admin/logout" method="POST">
                                <button
                                    type="submit"
                                    className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[48px]"
                                    style={{ color: 'var(--sidebar-muted)' }}
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
