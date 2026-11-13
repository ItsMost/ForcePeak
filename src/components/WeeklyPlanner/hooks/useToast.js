import { useState } from 'react';

/** Small 3-second toast message used across the planner. */
export function useToast() {
  const [toastMessage, setToastMessage] = useState(null);
  const handleToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000); };
  return { toastMessage, handleToast };
}
