import { AuthForm } from "@/features/auth/AuthForm";
import { loginAction } from "@/features/auth/actions";
export default function Page() { return <AuthForm action={loginAction} />; }
