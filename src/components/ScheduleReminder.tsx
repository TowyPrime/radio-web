import { Slot } from "@/lib/schedule/types";
import { MS_PER_DAY, REMINDER_DAYS, STATION_TIME_ZONE } from "@/lib/schedule/constants";

interface ScheduleReminderProps {
  slots: Slot[];
}

const fullDateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: STATION_TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

export default function ScheduleReminder({ slots }: ScheduleReminderProps) {
  if (slots.length === 0) {
    return (
      <div
        role="alert"
        className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300"
      >
        No hay horarios programados. La emisora quedará en silencio.
      </div>
    );
  }

  const now = new Date();

  const reminderLimitDate = new Date(
    now.getTime() + REMINDER_DAYS * MS_PER_DAY,
  );

  const lastSlot = slots[slots.length - 1];
  const lastEndsAt = new Date(lastSlot.ends_at);

  const formattedDate = fullDateTimeFormatter.format(lastEndsAt);

  if (lastEndsAt < reminderLimitDate) {
    return (
      <div
        role="status"
        className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300"
      >
        El último horario programado termina el {formattedDate}. Programa más
        horarios.
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mb-4 rounded-xl border border-brand-400/30 bg-brand-400/10 px-4 py-2 text-sm text-brand-300"
    >
      El último horario programado termina el {formattedDate}. La semana está
      cubierta.
    </div>
  );
}
