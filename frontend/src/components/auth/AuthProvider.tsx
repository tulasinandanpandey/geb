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
  | "broker";


interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: GEBRole[];
  loading: boolean;
  signOut: () => Promise<void>;
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

    const {
      data,
      error,
    } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);


    if (error) {

      console.error(
        "Unable to load GEB roles:",
        error
      );

      setRoles([]);

      return;

    }


    const validRoles =
      (data ?? [])
        .map(
          (item) =>
            item.role
        )
        .filter(
          (
            role
          ): role is GEBRole =>
            role === "buyer" ||
            role === "seller" ||
            role === "broker"
        );


    setRoles(
      validRoles
    );

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

        setRoles([]);

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

            setRoles([]);

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

  }


  return (

    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        loading,
        signOut,
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
