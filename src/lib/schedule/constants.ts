
export const STATION_UTC_OFFSET = "-06:00"
export const MAX_SLOT_HOURS = 24;
export const MARGIN_MS = 2 *60 *1000;
export const STATION_TIME_ZONE = "America/Mexico_City";
export const REMINDER_DAYS = 7;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseLocalDateTime(localDateTimeStr: string): Date | null {
    // Expresión regular para validar formato: YYYY-MM-DDTHH:mm (con segundos opcionales :ss)
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;
    
    if (!regex.test(localDateTimeStr)) {
        return null;
    }

    const fullDateTimeStr = localDateTimeStr.length === 16
        ? `${localDateTimeStr}:00`
        : localDateTimeStr;

    const isoWithOffset = `${fullDateTimeStr}${STATION_UTC_OFFSET}`;
    const date = new Date(isoWithOffset);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}