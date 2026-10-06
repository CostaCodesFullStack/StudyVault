import { AuthForm } from "@/features/auth/AuthForm";
import { registerAction } from "@/features/auth/actions";
export default function Page() { return <AuthForm action={registerAction} register />; }
