import { Suspense } from "react";
import LoginContent from "./loginContents";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div>Loading...</div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}