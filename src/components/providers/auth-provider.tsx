"use client";

import { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthContext = Readonly<{
    user: User | null;
    isLoading: boolean;
}>;

const AuthContext = createContext<AuthContext>({
    user: null,
    isLoading: true,
});

export function AuthProvider({
    initialUser,
    children,
}: {
    initialUser: User | null;
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const supabase = createSupabaseBrowserClient();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}