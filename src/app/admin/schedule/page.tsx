import ScheduleManager from "@/components/ScheduleManager";
import ScheduleReminder from "@/components/ScheduleReminder";
import { getUpcomingSlots } from "@/lib/schedule/queries";
import { Slot } from "@/lib/schedule/types";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  let slots: Slot[] = [];
  let loadFailed: boolean = false;

  try {
    slots = await getUpcomingSlots();
  } catch (error) {
    console.error("Error al traer horarios:", error);
    loadFailed = true;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      {loadFailed ? (
        <p className="mb-4 text-sm text-red-400">
          {" "}
          No se pudo comprobar la programación
        </p>
      ) : (
        <ScheduleReminder slots={slots} />
      )}
      <ScheduleManager />
    </div>
  );
}
