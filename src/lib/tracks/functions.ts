import { AppError } from "@/data/AppError";

 


  export const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);

      const timeoutId = setTimeout(() => {
        URL.revokeObjectURL(audioUrl);
        audio.src = "";
        reject(
          new AppError(
            "Timeout: El archivo tardó demasiado en procesarse o el formato no es compatible.",
          ),
        );
      }, 5000);

      audio.onloadedmetadata = () => {
        clearTimeout(timeoutId);
        URL.revokeObjectURL(audioUrl);

        if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
          reject(
            new AppError("El archivo de audio no tiene una duración válida."),
          );
          return;
        }

        resolve(audio.duration);
      };

      audio.onerror = () => {
        clearTimeout(timeoutId);
        URL.revokeObjectURL(audioUrl);
        reject(
          new AppError(
            "No se pudo leer la duración del archivo de audio (posible archivo corrupto).",
          ),
        );
      };
    });
  };

  export function convertSecondsInMinutes(duration: number): string{
    const minutes = Math.floor(duration/60);
    const seconds = Math.floor(duration % 60)

    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

    return `${minutes}:${formattedSeconds}`;
  }

  