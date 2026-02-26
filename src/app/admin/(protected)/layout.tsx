import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminLogoutButton from '../logout-button'
import MobileNav from './mobile-nav'
import { LayoutDashboard, Users, Utensils, ShoppingCart, Zap, Wallet, Landmark } from 'lucide-react'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
        redirect('/admin/login')
    }

    const navItems = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Members', href: '/admin/members', icon: Users },
        { name: 'Daily Meals', href: '/admin/meals', icon: Utensils },
        { name: 'Meal Deposits', href: '/admin/meal-deposits', icon: Wallet },
        { name: 'Groceries', href: '/admin/groceries', icon: ShoppingCart },
        { name: 'Utility Deposits', href: '/admin/utility-deposits', icon: Landmark },
        { name: 'Utility Bills', href: '/admin/utilities', icon: Zap },
    ]

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar — hidden on mobile */}
            <aside className="hidden lg:flex w-64 shrink-0 border-r bg-muted/40 p-6 flex-col fixed top-0 left-0 bottom-0">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <div className="h-8 w-8 rounded bg-foreground text-background flex items-center justify-center font-bold">
                        M
                    </div>
                    <span className="font-semibold text-lg tracking-tight">SuperMeal</span>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="mt-auto border-t pt-4">
                    <p className="px-3 text-xs text-muted-foreground truncate mb-3">
                        {data.user.email}
                    </p>
                    <AdminLogoutButton />
                </div>
            </aside>

            {/* Mobile Navigation (hamburger + drawer) */}
            <MobileNav userEmail={data.user.email ?? ''} />

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 lg:ml-64 flex flex-col min-h-screen">
                <div className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-12 w-full max-w-7xl mx-auto">
                    {children}
                </div>
                <footer className="border-t px-4 sm:px-6 lg:px-8 py-3 text-center lg:text-left">
                    <p className="text-[11px] text-muted-foreground/50 tracking-wide">
                        © 2026 SuperMeal&nbsp;&nbsp;|&nbsp;&nbsp;Crafted by <span className="font-mono font-semibold">MayazAD</span>
                    </p>
                </footer>
            </main>
        </div>
    )
}
