import { ReactNode, useContext } from "react";

// components
import { Loading } from "./Loading";

// context
import { GlobalStateContext } from "@/context/GlobalContext";

export const PageContainer = ({
  children,
  isLoading,
  headerText,
  headerRight,
}: {
  children: ReactNode;
  isLoading: boolean;
  headerText?: string;
  headerRight?: ReactNode;
}) => {
  const { error } = useContext(GlobalStateContext);

  if (isLoading) return <Loading />;

  return (
    <div className="h-full p-4 mb-28">
      {(headerText || headerRight) && (
        <div className="flex items-center justify-between pb-4">
          {headerText && <h2 className="h2">{headerText}</h2>}
          {headerRight}
        </div>
      )}
      {children}
      {error && <p className="p3 pt-10 text-center text-error">{error}</p>}
    </div>
  );
};

export default PageContainer;
