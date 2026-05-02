"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { SiteFooter } from "@/components/landing/SiteFooter";

/**
 * Marketing homepage. Composed of section components in `components/landing/`.
 * Authenticated / demo-mode users skip this entirely and land on /app.
 */
export default function Home() {
  const { mode, error, signInWithGoogle, continueAsDemo } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (mode === "authenticated" || mode === "demo") router.replace("/app");
  }, [mode, router]);

  const handleSignIn = async () => {
    await signInWithGoogle();
  };
  const handleDemo = () => {
    continueAsDemo();
  };

  return (
    <div className="bg-background text-foreground">
      <SiteHeader onSignIn={handleSignIn} onDemo={handleDemo} />
      <Hero
        onSignIn={handleSignIn}
        onDemo={handleDemo}
        authError={error}
      />
      <HowItWorks />
      <Features />
      <FinalCta onSignIn={handleSignIn} onDemo={handleDemo} />
      <SiteFooter />
    </div>
  );
}
