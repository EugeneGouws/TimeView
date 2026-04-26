import { createContext, useContext, useReducer } from "react";

const initialState = {
  authorized: false,
  timetableData: null,
  activeEntity: null, // { type: "teacher"|"student"|"subject"|"activity", id: string } | null
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_TIMETABLE":
      return { ...state, timetableData: action.payload, activeEntity: null };
    case "CLEAR_TIMETABLE":
      return { ...state, timetableData: null, activeEntity: null };
    case "SET_ACTIVE_ENTITY":
      return { ...state, activeEntity: action.payload };
    case "CLEAR_ACTIVE_ENTITY":
      return { ...state, activeEntity: null };
    case "SET_AUTHORIZED":
      return { ...state, authorized: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppContext);
}
