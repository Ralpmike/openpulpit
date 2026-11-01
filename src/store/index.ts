import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { api } from "@/store/api";
import { playerSlice } from "@/store/playerSlice";
import { uiSlice } from "@/store/uiSlice";

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  [uiSlice.name]: uiSlice.reducer,
  [playerSlice.name]: playerSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/** One store per browser tab (created in StoreProvider), never a module-level singleton. */
export function makeStore(preloadedState?: Partial<RootState>) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });
  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
