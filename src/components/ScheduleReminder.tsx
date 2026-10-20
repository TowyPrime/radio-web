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
      <div className="p-4 mb-4 text-red-400 bg-red border border-red-500 rounded-md">
        No hay horarios programados la emisora quedará en silencio.
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
      <div className="p-4 mb-4 text-amber-800 bg-amber-100 border border-amber-400 rounded-md">
        Último horario programado termina el {formattedDate}. Programa más horarios.
      </div>
    );
  }

  return (
    <div className="py-2 px-3 mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
       Último horario programado termina el {formattedDate}. La semana está cubierta
    </div>
  );
}
