import { cloneElement, isValidElement, useEffect, useRef, useState } from "react";

const EXIT_MS = 150;

/** Keep a closing overlay mounted long enough for its CSS exit transition. */
export default function Presence({ open, children, duration = EXIT_MS }) {
  const [present, setPresent] = useState(open);
  const lastChild = useRef(children);

  if (open && isValidElement(children)) lastChild.current = children;

  useEffect(() => {
    if (open) {
      setPresent(true);
      return undefined;
    }

    if (!present) return undefined;
    const timeout = window.setTimeout(() => setPresent(false), duration);
    return () => window.clearTimeout(timeout);
  }, [open, present, duration]);

  if (!present && !open) return null;
  const element = open && isValidElement(children) ? children : lastChild.current;
  if (!isValidElement(element)) return null;

  const phase = open ? "is-open" : "is-closing";
  return cloneElement(element, {
    className: [element.props.className, phase].filter(Boolean).join(" "),
    "aria-hidden": !open,
    inert: !open,
  });
}
