import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { toUserMessage } from '@/lib/data/errors'
import { isLocalBackend } from '@/lib/env'
import { forgotPasswordSchema } from '@/schemas'
import { AuthLayout } from '@/pages/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordPage() {
  const { client } = useAuth()
  const form = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })

  return (
    <AuthLayout title="Reset your password" subtitle="We’ll email a reset link if this address has an account.">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await client.requestPasswordReset(values.email)
            toast.success(
              isLocalBackend()
                ? 'Local mode does not send email. Sign in and change your password in Settings.'
                : 'If an account exists, a reset link is on its way.',
            )
          } catch (error) {
            toast.error(toUserMessage(error))
          }
        })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register('email')} />
        </div>
        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-sm">
        <Link to="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
