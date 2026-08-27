"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform } from "motion/react";

/**
 * Renders a count-up animated number. Formatting is expressed via primitive
 * props (not a formatter function) since this is a Client Component and its
 * callers are almost always Server Components — functions can't cross that
 * boundary as props, only serializable values.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  signed = false,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  signed?: boolean;
  className?: string;
}) {
  const format = (v: number) => {
    const sign = signed ? (v > 0 ? "+" : v < 0 ? "-" : "") : "";
    const abs = signed ? Math.abs(v) : v;
    const num = abs.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${sign}${prefix}${num}${suffix}`;
  };

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 24, mass: 0.6 });
  const display = useTransform(spring, format);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
  }, [display]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
