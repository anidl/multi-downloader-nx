import React from 'react';
import { StoreAction, StoreContext, StoreState } from '../provider/Store';

const useStore = () => {
  const context = React.useContext(StoreContext as unknown as React.Context<[StoreState, React.Dispatch<StoreAction<keyof StoreState>>]>);
  if (!context) {
    throw new Error('useStore must be used under Store');
  }
  return context;
};

export default useStore;