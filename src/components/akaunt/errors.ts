import {
  isClerkAPIResponseError,
  isReverificationCancelledError,
} from '@clerk/nextjs/errors'

// You closed the "Потвърди, че си ти" step: nothing to report.
export const wasCancelled = (error: unknown) =>
  isReverificationCancelledError(error)

const MESSAGES: Record<string, string> = {
  form_identifier_exists: 'Този имейл вече се ползва.',
  form_param_format_invalid: 'Този имейл не изглежда верен. Провери го.',
  form_param_nil: 'Напиши нещо, преди да продължиш.',
  form_code_incorrect: 'Кодът не е верен. Провери го и опитай пак.',
  verification_expired: 'Кодът изтече. Прати си нов.',
  verification_failed: 'Твърде много опити с този код. Прати си нов.',
  too_many_requests: 'Твърде много опити. Изчакай малко и опитай пак.',
  user_locked: 'Твърде много опити. Изчакай малко и опитай пак.',
}

// Clerk's own messages are English, so every error the panel shows is ours.
export function errorMessage(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    for (const e of error.errors) {
      const message = MESSAGES[e.code]
      if (message) return message
    }
  }
  return 'Нещо се обърка. Опитай пак.'
}
