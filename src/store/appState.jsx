import { useReducer } from "react";
import { AppContext } from "./appContext";

const initialState = {
  timetableData: null,
  activeEntity: null, // { type: "teacher"|"student"|"subject"|"activity", id: string } | null
  compareEntities: [], // [{ type, id }] overlay sources, uncapped
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
    // Closing the primary chip promotes the next comparison entity instead of
    // tearing down the whole comparison.
    case "CLOSE_ACTIVE_ENTITY": {
      const [next, ...rest] = state.compareEntities;
      return { ...state, activeEntity: next ?? null, compareEntities: next ? rest : [] };
    }
    case "ADD_COMPARE_ENTITY": {
      const e = action.payload;
      if (!state.activeEntity) return state;
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

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
