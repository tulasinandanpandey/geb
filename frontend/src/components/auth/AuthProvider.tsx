"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  Session,
  User,
} from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";


export type GEBRole =
  | "buyer"
  | "seller"
  | "broker"
  | "dealer"
  | "engineer";


interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: GEBRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  updateRoles: (newRoles: GEBRole[]) => void;
  refreshRoles: () => Promise<void>;
}


const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );


export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [user, setUser] =
    useState<User | null>(null);

  const [session, setSession] =
    useState<Session | null>(null);

  const [roles, setRoles] =
    useState<GEBRole[]>([]);

  const [loading, setLoading] =
    useState(true);


  async function loadRoles(
    userId: string
  ) {
    let localRoles: GEBRole[] = [];
    try {
      const stored = localStorage.getItem("geb_user_roles");
      if (stored) {
        localRoles = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Notice reading geb_user_roles from localStorage:", e);
    }

    const {
      data,
      error,
    } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const dbRoles = (data ?? [])
      .map((item) => item.role)
      .filter(
        (role): role is GEBRole =>
          role === "buyer" ||
          role === "seller" ||
          role === "broker" ||
          role === "dealer" ||
          role === "engineer"
      );

    const combinedSet = new Set<GEBRole>([...dbRoles, ...localRoles]);
    if (combinedSet.size === 0) {
      combinedSet.add("buyer");
    }

    const merged = Array.from(combinedSet);
    setRoles(merged);
    try {
      localStorage.setItem("geb_user_roles", JSON.stringify(merged));
    } catch (e) {}
  }

  function updateRoles(newRoles: GEBRole[]) {
    setRoles((prev) => {
      const mergedSet = new Set<GEBRole>([...prev, ...newRoles]);
      const updated = Array.from(mergedSet);
      try {
        localStorage.setItem("geb_user_roles", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }

  async function refreshRoles() {
    if (user?.id) {
      await loadRoles(user.id);
    }
  }


  useEffect(() => {

    let mounted = true;


    async function initialize() {

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();


      if (!mounted) {
        return;
      }


      setSession(session);

      setUser(
        session?.user ?? null
      );


      if (session?.user) {

        await loadRoles(
          session.user.id
        );

      } else {

        let storedRoles: GEBRole[] = [];
        try {
          const s = localStorage.getItem("geb_user_roles");
          if (s) storedRoles = JSON.parse(s);
        } catch (e) {}
        setRoles(storedRoles.length > 0 ? storedRoles : []);

      }


      setLoading(false);

    }


    initialize();


    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          newSession
        ) => {

          if (!mounted) {
            return;
          }


          setSession(
            newSession
          );

          setUser(
            newSession?.user ?? null
          );


          if (newSession?.user) {

            await loadRoles(
              newSession.user.id
            );

          } else {

            let storedRoles: GEBRole[] = [];
            try {
              const s = localStorage.getItem("geb_user_roles");
              if (s) storedRoles = JSON.parse(s);
            } catch (e) {}
            setRoles(storedRoles.length > 0 ? storedRoles : []);

          }


          setLoading(false);

        }
      );


    return () => {

      mounted = false;

      subscription.unsubscribe();

    };

  }, []);


  async function signOut() {

    await supabase.auth.signOut();

    setUser(null);

    setSession(null);

    setRoles([]);
    try {
      localStorage.removeItem("geb_user_roles");
    } catch (e) {}

  }


  return (

    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        loading,
        signOut,
        updateRoles,
        refreshRoles,
      }}
    >

      {children}

    </AuthContext.Provider>

  );

}


export function useAuth() {

  const context =
    useContext(
      AuthContext
    );


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }


  return context;

}
