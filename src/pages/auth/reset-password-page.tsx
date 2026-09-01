import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { toUserMessage } from '@/lib/data/errors'
import { resetPasswordSchema } from '@/schemas'
import { AuthLayout } from '@/pages/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetPasswordPage() {
  const { client } = useAuth()
  const navigate = useNavigate()
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  return (
    <AuthLayout title="Choose a new password" subtitle="Use at least 8 characters.">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await client.updatePassword(values.password)
            toast.success('Password updated')
            navigate('/login')
          } catch (error) {
            toast.error(toUserMessage(error))
          }
        })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" {...form.register('password')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" {...form.register('confirmPassword')} />
          {form.formState.errors.confirmPassword ? (
            <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
          ) : null}
        </div>
        <Button className="w-full" type="submit">
          Update password
        </Button>
      </form>
    </AuthLayout>
  )
}
