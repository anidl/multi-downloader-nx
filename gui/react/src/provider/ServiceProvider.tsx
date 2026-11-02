import React from 'react';
import useStore from '../hooks/useStore';
import { ServiceName } from './Store';

export const serviceContext = React.createContext<ServiceName | undefined>(undefined);

const ServiceProvider: FCWithChildren = ({ children }) => {
	const [{ service }] = useStore();
	return <serviceContext.Provider value={service}>{children}</serviceContext.Provider>;
};
export default ServiceProvider;
