import { UIProvider } from "./UIContext";

const Providers = ({ children }) => {
  return (
    <UIProvider>
      {/* Add other providers in the proper nesting order */}
      {children}
    </UIProvider>
  );
};

export default Providers;