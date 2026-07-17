import { useEffect, useState } from "react";

let listeners: ((msg: string) => void)[] = [];

/** Announce a status message to assistive tech. Call from anywhere. */
export function announce(message: string) {
  listeners.forEach((l) => l(message));
}

/** Global ARIA live region. Mount once at the app root. */
export function LiveRegion() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const l = (m: string) => {
      // reset then set so identical messages re-announce
      setMsg("");
      requestAnimationFrame(() => setMsg(m));
    };
    listeners.push(l);
    return () => { listeners = listeners.filter((x) => x !== l); };
  }, []);
  return (
    <div aria-live="polite" aria-atomic="true" role="status" className="sr-only">
      {msg}
    </div>
  );
}