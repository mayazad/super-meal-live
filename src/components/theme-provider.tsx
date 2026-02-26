'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

type Props = { children: React.ReactNode }

export default function ThemeProvider({ children }: Props) {
    const supabase = createClient()

    const applyTheme = (theme: string) => {
        document.documentElement.setAttribute('data-theme', theme || 'classic')
    }

    useEffect(() => {
        // 1. Fetch the current theme on mount
        supabase
            .from('app_settings')
            .select('selected_theme')
            .eq('id', 'global_config')
            .single()
            .then(({ data }) => {
                if (data?.selected_theme) applyTheme(data.selected_theme)
            })

        // 2. Subscribe to realtime changes so all screens update instantly
        const channel = supabase
            .channel('theme-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'app_settings',
                    filter: 'id=eq.global_config',
                },
                (payload) => {
                    const newTheme = payload.new?.selected_theme
                    if (newTheme) applyTheme(newTheme)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return <>{children}</>
}
