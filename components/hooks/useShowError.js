import React from "react";
import { toast, ToastContainer } from "react-toastify";

export const useShowError = (message) => {
  toast.error(message, {
    position: "bottom-center",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};
