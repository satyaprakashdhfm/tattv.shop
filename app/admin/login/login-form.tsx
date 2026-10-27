"use client";

import { useActionState, useRef } from "react";
import { login } from "../actions";

export function LoginForm({ test }: { test: { username: string; password: string } | null }) {
  const [state, action, pending] = useActionState(login, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Fill in the test credentials and submit in one click.
  const signInAsTest = () => {
    const f = formRef.current!;
    (f.elements.namedItem("username") as HTMLInputElement).value = test!.username;
    (f.elements.namedItem("password") as HTMLInputElement).value = test!.password;
    f.requestSubmit();
  };

  return (
    <>
      <form ref={formRef} action={action} className="mt-6 space-y-4">
        <div>
          <label htmlFor="un" className="adm-label">
            Username
          </label>
          <input id="un" name="username" autoComplete="username" defaultValue="admin" required className="adm-input" />
        </div>
        <div>
          <label htmlFor="pw" className="adm-label">
            Password
          </label>
          <input id="pw" name="password" type="password" autoComplete="current-password" required autoFocus className="adm-input" />
        </div>
        {state?.error && (
          <p role="alert" className="adm-error">
            {state.error}
          </p>
        )}
        <button className="btn btn-dark w-full" disabled={pending}>
          {pending ? "Checking…" : "Sign In"}
        </button>
      </form>

      {test && (
        <div className="mt-6 border-t border-line pt-6">
          <p className="text-sm">
            <b className="font-medium">Test login</b>, for trying out the admin portal
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-sand px-3 py-2">
              <dt className="adm-label !mb-0">Username</dt>
              <dd className="font-mono">{test.username}</dd>
            </div>
            <div className="rounded-xl bg-sand px-3 py-2">
              <dt className="adm-label !mb-0">Password</dt>
              <dd className="font-mono">{test.password}</dd>
            </div>
          </dl>
          <button type="button" className="btn btn-outline mt-4 w-full" onClick={signInAsTest} disabled={pending}>
            Sign in as test admin
          </button>
          <p className="mt-3 text-xs text-muted">
            Anyone who opens this page can use these. Remove <code>ADMIN_TEST_LOGIN</code> before launch.
          </p>
        </div>
      )}
    </>
  );
}
