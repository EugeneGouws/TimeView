// Crawford lesson times reference. Manually editable.
// Each row = { label, cells: [{ label, time, kind }] }
// kind = "support" | "lesson" | "reg" | "break" | "assembly" | "test"
// Determines background colour in TimesGrid.

export const TIMES_ROWS = [
  {
    label: "NORMAL DAY",
    cells: [
      { label: "SUPPORT", time: "07:00–07:40", kind: "support" },
      { label: "L1",      time: "07:45–08:35", kind: "lesson" },
      { label: "L2",      time: "08:35–09:25", kind: "lesson" },
      { label: "REG",     time: "09:25–09:35", kind: "reg" },
      { label: "BREAK",   time: "09:35–09:55", kind: "break" },
      { label: "L3",      time: "09:55–10:45", kind: "lesson" },
      { label: "L4",      time: "10:45–11:35", kind: "lesson" },
      { label: "L5",      time: "11:35–12:25", kind: "lesson" },
      { label: "BREAK",   time: "12:25–12:50", kind: "break" },
      { label: "L6",      time: "12:50–13:40", kind: "lesson" },
      { label: "L7",      time: "13:40–14:30", kind: "lesson" },
      { label: "SUPPORT", time: "14:30–15:15", kind: "support" },
    ],
  },
  {
    label: "ASSEMBLY DAY",
    cells: [
      { label: "SUPPORT",  time: "07:00–07:40", kind: "support" },
      { label: "L1",       time: "07:45–08:30", kind: "lesson" },
      { label: "L2",       time: "08:30–09:15", kind: "lesson" },
      { label: "REG",      time: "09:15–09:25", kind: "reg" },
      { label: "BREAK",    time: "09:25–09:45", kind: "break" },
      { label: "L3",       time: "09:45–10:30", kind: "lesson" },
      { label: "L4",       time: "10:30–11:15", kind: "lesson" },
      { label: "L5",       time: "11:15–12:00", kind: "lesson" },
      { label: "ASSEMBLY", time: "12:00–12:40", kind: "assembly" },
      { label: "BREAK",    time: "12:40–13:00", kind: "break" },
      { label: "L6",       time: "13:00–13:45", kind: "lesson" },
      { label: "L7",       time: "13:45–14:30", kind: "lesson" },
      { label: "SUPPORT",  time: "14:30–15:15", kind: "support" },
    ],
  },
  {
    label: "TEST DAY",
    cells: [
      { label: "SUPPORT",  time: "07:00–07:40", kind: "support" },
      { label: "TEST",    time: "07:45–09:00", kind: "test" },
      { label: "L1",      time: "09:00–09:40", kind: "lesson" },
      { label: "REG",     time: "09:40–09:50", kind: "reg" },
      { label: "BREAK",   time: "09:50–10:10", kind: "break" },
      { label: "L2",      time: "10:10–10:50", kind: "lesson" },
      { label: "L3",      time: "10:50–11:30", kind: "lesson" },
      { label: "L4",      time: "11:30–12:10", kind: "lesson" },
      { label: "BREAK",   time: "12:10–12:30", kind: "break" },
      { label: "L5",      time: "12:30–13:10", kind: "lesson" },
      { label: "L6",      time: "13:10–13:50", kind: "lesson" },
      { label: "L7",      time: "13:50–14:30", kind: "lesson" },
      { label: "SUPPORT", time: "14:30–15:15", kind: "support" },
    ],
  },
  {
    label: "LONG REG",
    cells: [
      { label: "SUPPORT", time: "07:00–07:40", kind: "support" },
      { label: "L1",      time: "07:45–08:35", kind: "lesson" },
      { label: "L2",      time: "08:35–09:25", kind: "lesson" },
      { label: "REG",     time: "09:25–09:55", kind: "reg" },
      { label: "BREAK",   time: "09:55–10:15", kind: "break" },
      { label: "L3",      time: "10:15–11:05", kind: "lesson" },
      { label: "L4",      time: "11:05–11:50", kind: "lesson" },
      { label: "L5",      time: "11:50–12:35", kind: "lesson" },
      { label: "BREAK",   time: "12:35–13:00", kind: "break" },
      { label: "L6",      time: "13:00–13:45", kind: "lesson" },
      { label: "L7",      time: "13:45–14:30", kind: "lesson" },
      { label: "SUPPORT", time: "14:30–15:15", kind: "support" },
    ],
  },
];

export const KIND_BG = {
  support:  "#fff3cd",
  lesson:   "#FFFFFF",
  reg:      "#fce8d5",
  break:    "#d4edda",
  assembly: "#cfe2f3",
  test:     "#f8d7da",
};
