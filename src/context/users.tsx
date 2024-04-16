// context definition

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../constants/api";
import getHeaders from "../utils/getHeaders";
import { guardCtx } from "./Guard";
import { notificationCtx } from "./notification";

const usersCtx = React?.createContext({});

const UsersContext = ({ children }) => {
  const [users, setUsers] = React?.useState([]);

  const navigate = useNavigate();

  const notifsContext = React?.useContext(notificationCtx);

  const showError = notifsContext?.showError;

  const isUserAuthenticanted =
    React?.useContext(guardCtx)?.isUserAuthenticanted;

  const setLoadingMap = React?.useContext(guardCtx)?.setLoadingMap;

  const fetchUsers = async () => {
    await lookup(`${BASE_URL}/api/users`, {
      headers: getHeaders({}),
    })
      .then((res) =>
        res
          .json()
          .then((res) => {
            console.log("received users data", res);

            setLoadingMap(true, "_users");

            const _users = res?.map((target) => {
              return {
                id: target?.id,
                email: target?.email,
                fullName: target?.username,
                department: target?.department?.name,
                imageLink: target?.profile,
                role: target?.role,
              };
            });

            console.log("processed users data for consumption", _users);

            setUsers(_users);

            setLoadingMap(false, "_users");
          })
          .catch((error) => {
            console.log("an error has occured when fetching users", error);

            setLoadingMap(false, "_users");

            showError("Une erreur est survenue lors du chargement");
          })
      )
      .catch((error) => {
        console.log("an error has occured when fetching users", error);

        setLoadingMap(false, "_users");
      });
  };

  React?.useEffect(() => {
    if (isUserAuthenticanted) {
      const _headers = new Headers();

      setLoadingMap(true, "_users");

      _headers?.append("Content-Type", "application/json");
      _headers?.append(
        "Authorization",
        `Bearer ${sessionStorage.getItem("token")}`
      );

      (async () => {
        await fetchUsers()
          .then(() => {
            console.log("successfully fetched users data ");
          })
          .catch((error) => {
            console.log("an error has occured when fetching users", error);
          });
      })();
    } else {
      if (!window?.location?.pathname?.includes("-password")) {
        navigate("/login", { replace: true });
      } else {
        console.log("prevented moving to login as we are trating passwords");
      }
    }

    setLoadingMap(false, "_users");
  }, [isUserAuthenticanted]);

  return (
    <usersCtx.Provider
      value={{
        users,
        setUsers,
        fetchUsers,
      }}
    >
      {children}
    </usersCtx.Provider>
  );
};

export { usersCtx };

export default UsersContext;
