import Image from "next/image";
import { redirect } from "next/navigation";
import { TEST_ADMIN, adminConfigured, adminTestLogin, isAdmin } from "@/lib/server/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-16">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-lift">
        <Image src="/brand/logo-black.png" alt="TATTV" width={1147} height={294} className="mx-auto h-auto w-[150px]" />
        <h1 className="title mt-8 text-center text-base">Store Admin</h1>
        {adminConfigured() ? (
          <LoginForm test={adminTestLogin() ? TEST_ADMIN : null} />
        ) : (
          <p className="adm-note mt-6">
            Set the <code>ADMIN_PASSWORD</code> environment variable on the server to switch on the admin portal.
          </p>
        )}
      </div>
    </div>
  );
}
