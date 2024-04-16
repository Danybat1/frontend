// context defintion

import * as React from "react";
import { BASE_URL } from "../constants/api";
import getHeaders from "../utils/getHeaders";
import { guardCtx } from "./Guard";

const rolesCtx = React?.createContext({});

const RolesContext = ({ children }) => {
  const [roles, setRoles] = React?.useState([]);

  const isUserAuthenticanted = React.useContext(guardCtx)?.isUserAuthenticanted;

  React?.useEffect(() => {
    if (isUserAuthenticanted) {
      (async () => {
        console.log("will fetch roles data ...");

        await lookup(`${BASE_URL}/api/users-permissions/roles`, {
          headers: getHeaders({}),
          method: "GET",
        })
          .then((res) =>
            res.json().then((res) => {
              console.log("received roles data here ", res);

              if (res?.roles) {
                setRoles(res?.roles);
              }
            })
          )
          .catch((error) => {
            console.log(
              "an error has occured when trying fetching roles",
              error
            );
          });
      })();
    }
  }, [isUserAuthenticanted]);

  return (
    <rolesCtx.Provider
      value={{
        roles,
      }}
    >
      {children}
    </rolesCtx.Provider>
  );
};

export default RolesContext;
export { rolesCtx };
