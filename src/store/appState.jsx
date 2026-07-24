import { createContext, useContext, useReducer } from "react";

const MAX_COMPARE = 3;

const initialState = {
  timetableData: null,
  activeEntity: null, // { type: "teacher"|"student"|"subject"|"activity", id: string } | null
  compareEntities: [], // [{ type, id }] overlay sources, max MAX_COMPARE
};

const sameEntity = (a, b) => a.type === b.type && a.id === b.id;

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_TIMETABLE":
      return { ...state, timetableData: action.payload, activeEntity: null, compareEntities: [] };
    case "CLEAR_TIMETABLE":
      return { ...state, timetableData: null, activeEntity: null, compareEntities: [] };
    case "SET_ACTIVE_ENTITY":
      return { ...state, activeEntity: action.payload, compareEntities: [] };
    case "CLEAR_ACTIVE_ENTITY":
      return { ...state, activeEntity: null, compareEntities: [] };
    case "ADD_COMPARE_ENTITY": {
      const e = action.payload;
      if (!state.activeEntity || state.compareEntities.length >= MAX_COMPARE) return state;
      if (sameEntity(e, state.activeEntity)) return state;
      if (state.compareEntities.some(c => sameEntity(c, e))) return state;
      return { ...state, compareEntities: [...state.compareEntities, e] };
    }
    case "REMOVE_COMPARE_ENTITY":
      return {
        ...state,
        compareEntities: state.compareEntities.filter(c => !sameEntity(c, action.payload)),
      };
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
