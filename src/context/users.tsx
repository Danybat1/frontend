// context definition

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { guardCtx } from "./Guard";

const usersCtx = React?.createContext({});

const UsersContext = ({ children }) => {
  const [users, setUsers] = React?.useState([]);

  const navigate = useNavigate();

  const isUserAuthenticanted =
    React?.useContext(guardCtx)?.isUserAuthenticanted;

  React?.useEffect(() => {
    if (isUserAuthenticanted) {
      const _headers = new Headers();

      _headers?.append("Content-Type", "application/json");
      _headers?.append(
        "Authorization",
        `Bearer ${sessionStorage.getItem("token")}`
      );

      (async () => {
        await lookup(`${process.env.REACT_APP_API_HOST}/api/users`, {
          headers: _headers,
        })
          .then((res) =>
            res
              .json()
              .then((res) => {
                console.log("received users data", res);

                const _users = res?.map((target) => {
                  return {
                    id: target?.id,
                    email: target?.email,
                    fullName: target?.username,
                    department: target?.department?.name,
                    imageLink: target?.profile,
                  };
                });

                console.log("processed users data for consumption", _users);

                setUsers(_users);
              })
              .catch((error) => {
                console.log("an error has occured when fetching users", error);
              })
          )
          .catch((error) => {
            console.log("an error has occured when fetching users", error);
          });
      })();
    } else {
      navigate("/login", { replace: true });
    }
  }, []);

  return (
    <usersCtx.Provider
      value={{
        users,
        setUsers,
      }}
    >
      {children}
    </usersCtx.Provider>
  );
};

export { usersCtx };

export default UsersContext;
