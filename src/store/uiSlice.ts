import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** Shared UI state only: things several screens need. Never server data. */
export interface UiState {
  isInstallPromptDismissed: boolean;
}

const initialState: UiState = {
  isInstallPromptDismissed: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    dismissInstallPrompt(state) {
      state.isInstallPromptDismissed = true;
    },
    setInstallPromptDismissed(state, action: PayloadAction<boolean>) {
      state.isInstallPromptDismissed = action.payload;
    },
  },
});

export const { dismissInstallPrompt, setInstallPromptDismissed } = uiSlice.actions;
