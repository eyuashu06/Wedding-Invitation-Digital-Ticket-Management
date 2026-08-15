import { useEffect, useState } from "react";

interface CountdownProps {
  date: string | null;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function getTimeLeft(dateStr: string | null): TimeLeft {
  if (!dateStr) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  target.setHours(23, 59, 59, 999);
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: diff < -86400000 };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, isPast: false };
}

export function Countdown({ date, className = "" }: CountdownProps) {
  const [time, setTime] = useState(() => getTimeLeft(date));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(date)), 1000);
    return () => clearInterval(id);
  }, [date]);

  if (!date) return null;

  if (time.isPast) {
    return (
      <div className={`text-center ${className}`}>
        <p className="font-script text-2xl text-rose-400">The celebration has begun!</p>
      </div>
    );
  }

  const isToday = time.days === 0;

  return (
    <div className={`text-center ${className}`}>
      <p className="mb-4 text-sm font-medium uppercase tracking-widest text-stone-400">
        {isToday ? "Today is the big day!" : "Counting down to the big day"}
      </p>
      <div className="flex items-start justify-center gap-4">
        {[
          { value: time.days, label: "Days" },
          { value: time.hours, label: "Hours" },
          { value: time.minutes, label: "Min" },
          { value: time.seconds, label: "Sec" },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-gold-50 to-gold-100 shadow-sm ring-1 ring-gold-200 dark:from-gold-900/40 dark:to-gold-900/20 dark:ring-gold-800">
              <span className="font-serif text-2xl font-bold text-gold-800 dark:text-gold-300">
                {String(value).padStart(2, "0")}
              </span>
            </div>
            <span className="mt-1.5 text-xs font-medium uppercase tracking-wider text-stone-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
