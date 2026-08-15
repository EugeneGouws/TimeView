import { createContext, useContext } from "react";

// Split out of appState.jsx so that file exports only the AppProvider component.
// A module mixing components with other exports defeats Fast Refresh, and a full
// reload drops the in-memory timetable — forcing the user to re-pick the file.
export const AppContext = createContext(null);

export function useAppState() {
  return useContext(AppContext);
}
