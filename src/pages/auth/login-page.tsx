import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { toUserMessage } from '@/lib/data/errors'
import { authSchema, type AuthValues } from '@/schemas'
import { AuthLayout } from '@/pages/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const { signIn, client } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const form = useForm<AuthValues>({ resolver: zodResolver(authSchema), defaultValues: { email: '', password: '' } })

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your workspace.">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await signIn(values.email, values.password)
            const from = (location.state as { from?: string } | null)?.from ?? '/'
            navigate(from, { replace: true })
          } catch (error) {
            toast.error(toUserMessage(error))
          }
        })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          {form.formState.errors.email ? (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
        {client.backend === 'supabase' ? (
          <Button
            className="w-full"
            type="button"
            variant="outline"
            onClick={() => void client.signInWithGoogle().catch((error) => toast.error(toUserMessage(error)))}
          >
            Continue with Google
          </Button>
        ) : null}
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        New to Aureum?{' '}
        <Link to="/signup" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
