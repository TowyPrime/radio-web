import { showToast } from "nextjs-toast-notify";

export const notify = {
  success: (message: string) => {
    showToast.success(message, {
      duration: 2000,
      position: "top-right",
      transition: "fadeIn",
    });
  },
  error: (message: string) => {
    showToast.error(message, {
      duration: 2000,
      position: "top-right",
      transition: "fadeIn",
    });
  },
  warning: (message: string) =>{
    showToast.warning(message,{
      duration:2000,
      position: "top-right",
      transition: "fadeIn"
    });
  }
};