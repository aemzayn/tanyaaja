import { useForm } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'
import { includes, maxLength, minLength, object, Output, string } from 'valibot'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { DialogOrSheet } from '../DialogOrSheet'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { useToast } from '../ui/use-toast'
import useSendReportUser from './useSendReportUser'

const schema = object({
  reason: string('Alasan perlu disi terlebih dahulu.', [
    minLength(20, 'Pertanyaan butuh paling tidak 20 karakter.'),
    maxLength(1000, 'Pertanyaan hanya bisa maksimal 1000 karakter.'),
    includes(' ', 'Pertanyaan membutuhkan lebih dari satu kata.'),
  ]),
})

type FormValues = Output<typeof schema>

const STORAGE_KEY = 'reported-users'
export const ReportUserDialog = ({
  user,
  isOpen,
  onOpenChange,
}: {
  user: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}) => {
  const { toast } = useToast()
  const { mutate, isPending } = useSendReportUser()

  const form = useForm<FormValues>({
    resolver: valibotResolver(schema),
    defaultValues: {
      reason: '',
    },
  })

  async function onSubmit(data: FormValues) {
    const storageVal = localStorage.getItem(STORAGE_KEY) || '[]'
    const reportedUsers = JSON.parse(storageVal) as string[]

    if (!reportedUsers.includes(user)) {
      mutate(
        { reason: data.reason, user },
        {
          onSuccess: () => {
            // Save new reported users to local storage
            const newReportedUsers = [...reportedUsers, user]
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newReportedUsers))

            onOpenChange(false)
          },
          onError: () => {
            toast({
              title: 'Gagal melaporkan pengguna',
              description: `Gagal saat mencoba melaporkan pengguna, coba sesaat lagi!`,
            })
          },
        },
      )
    } else {
      toast({
        title: 'Sudah melaporkan pengguna',
        description: `Kami mendeteksi bahwa Anda sudah melaporkan pengguna ini sebelumnya.`,
      })
    }
  }

  return (
    <DialogOrSheet
      title="Laporkan Pengguna"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      withAction={false}
    >
      <h2 className="mt-4">Apakah Anda yakin ingin melaporkan "{user}"?</h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-6 mt-6"
        >
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alasan</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={`Beritahu kami Alasan Anda melaporkan ${user}`}
                    rows={7}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              type="button"
              disabled={isPending}
              onClick={() => {
                form.reset()
                onOpenChange(false)
              }}
            >
              Batalkan
            </Button>
            <Button type="submit" disabled={isPending}>
              Laporkan
            </Button>
          </div>
        </form>
      </Form>
    </DialogOrSheet>
  )
}