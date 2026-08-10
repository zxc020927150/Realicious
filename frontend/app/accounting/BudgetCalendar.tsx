"use client";

import { DayPicker } from "react-day-picker";
import { zhTW } from "react-day-picker/locale";
import "react-day-picker/style.css";
import "./calendar.css";

export default function BudgetCalendar({
  selected,
  onSelect,
  spendDays = [],
  incomeDays = [],
  overDays = [],  
  month,
  onMonthChange,
}: {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  spendDays?: Date[];
  incomeDays?: Date[];
  overDays?: Date[];
  month?: Date;
  onMonthChange?: (m: Date) => void;
}) {
  return (
    <DayPicker
      mode="single"
      locale={zhTW}
      selected={selected}
      onSelect={onSelect}
      month={month}
      onMonthChange={onMonthChange}
      showOutsideDays
      modifiers={{ spend: spendDays, income: incomeDays, over: overDays }}
      modifiersClassNames={{ spend: "day-spend", income: "day-income", over: "day-over" }}
    />
  );
}