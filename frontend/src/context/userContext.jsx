import { createContext,useState } from "react";
import PropTypes from "prop-types";

 const UserContext = createContext();

const UserProvider = ({ children = "" }) => {
  const [userType, setUserType] = useState(""); // Default userType

  return (
    <UserContext.Provider value={{ userType, setUserType }}>
      {children}
    </UserContext.Provider>
  );
};
UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export  { UserContext, UserProvider };