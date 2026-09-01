import { useState } from 'react'
import { toast } from 'sonner'
import { Paperclip, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { RECEIPT_ACCEPT, isImageFile } from '@/lib/utils'
import { toUserMessage } from '@/lib/data/errors'

export function FileUploader({
  transactionId,
  path,
  name,
  onChange,
}: {
  transactionId: string
  path: string | null
  name: string | null
  onChange: () => void
}) {
  const { client } = useAuth()
  const [preview, setPreview] = useState<string | null>(null)

  async function load() {
    if (!path) return
    const url = await client.getReceiptUrl(path)
    setPreview(url)
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
      <p className="text-sm font-medium">Receipt</p>
      {path ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <button type="button" className="text-primary hover:underline" onClick={() => void load()}>
            {name ?? 'View receipt'}
          </button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Remove receipt"
            onClick={async () => {
              try {
                await client.deleteReceipt(path)
                await client.updateTransaction(transactionId, { attachmentPath: null, attachmentName: null })
                setPreview(null)
                onChange()
              } catch (error) {
                toast.error(toUserMessage(error))
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : null}
      {preview ? (
        isImageFile(preview.startsWith('data:application/pdf') ? 'application/pdf' : 'image/png') ? (
          <img src={preview} alt="Receipt preview" className="max-h-48 rounded-md" />
        ) : (
          <a href={preview} target="_blank" rel="noreferrer" className="text-sm text-primary">
            Open receipt
          </a>
        )
      ) : null}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <Paperclip className="size-4" />
        {path ? 'Replace file' : 'Attach JPG, PNG, WebP, or PDF'}
        <Input
          type="file"
          accept={RECEIPT_ACCEPT}
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (!file) return
            try {
              await client.uploadReceipt(transactionId, file)
              onChange()
              toast.success('Receipt attached')
            } catch (error) {
              toast.error(toUserMessage(error))
            }
          }}
        />
      </label>
    </div>
  )
}
