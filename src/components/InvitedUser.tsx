// component definition
import * as React from "react";

import Layout from "./Layout";
import {
  useTheme,
  Stack,
  Box,
  Typography,
  MenuItem,
  Grid,
  TextField,
  FormControl,
  Select,
  InputLabel,
} from "@mui/material";
import NavigationLine from "./NavigationLine";
import { usersCtx } from "../context/users";
import getHeaders from "../utils/getHeaders";
import { useNavigate } from "react-router-dom";

import { BASE_URL } from "../constants/api";
import { rolesCtx } from "../context/rolesCtx";

const InvitedUser = ({}) => {
  const theme = useTheme();

  const navigate = useNavigate();

  const roles = React?.useContext(rolesCtx)?.roles;

  const editMode = window?.location?.pathname?.includes("/user/edit");

  const usersContext = React?.useContext(usersCtx);

  const currUserId = new URLSearchParams(window?.location?.search)?.get("id");

  const users = usersContext?.users;

  const [defaultUser, setDefaultUser] = React?.useState(
    users?.find(
      (target) => target?.id?.toString() === currUserId?.toString()
    ) || {}
  );

  const fetchUsers = usersContext?.fetchUsers;

  React?.useEffect(() => {
    setDefaultUser(
      users?.find(
        (target) => target?.id?.toString() === currUserId?.toString()
      ) || {}
    );

    console.log(
      "current users here",
      users,
      users?.find(
        (target) => target?.id?.toString() === currUserId?.toString()
      ),
      currUserId,
      editMode
    );
  }, [users]);

  const fields = [
    {
      field: "username",
      title: "Nom complet",
      required: true,
    },
    {
      field: "email",
      title: "Addresse mail",
      required: true,
    },
    {
      field: "password",
      title: "Mot de passe",
      required: false,
    },
  ];

  if (editMode && fields?.every((target) => target?.field !== "role")) {
    fields?.push({
      field: "role",
      title: "Rôle",
      required: true,
    });
  }

  const handleSubmit = async (event) => {
    event?.preventDefault();

    if (
      window.confirm(
        `Voulez-vous procéder à la ${editMode ? "mise à jour" : "création"} ?`
      )
    ) {
      const submitObj = {};

      const formData = new FormData(event.currentTarget);

      for (let [key, value] of formData.entries()) {
        submitObj[key] = value;

        // alert(value);
      }

      if (submitObj["password"]?.length < 3) {
        delete submitObj["password"];
      }

      console.log("received data for user action", submitObj, editMode);

      if (editMode) {
        await lookup(`${BASE_URL}/api/users/${currUserId}`, {
          method: "PUT",
          headers: getHeaders({}),
          body: JSON.stringify(submitObj),
        })
          .then((res) =>
            res.json().then(async (res) => {
              console.log("received data after update", res);

              await fetchUsers()
                .then(() => {
                  console.log("successfully updated users list");
                })
                .catch((error) => {
                  console.log(
                    "an error has occured when updating users",
                    error
                  );
                });
              navigate("/access-management");
            })
          )
          .catch((error) => {
            console.log("an error has occured when updating a user", error);
          });
      } else {
        await lookup(`${BASE_URL}/api/auth/local/register`, {
          method: "POST",
          headers: getHeaders({}),
          body: JSON.stringify(submitObj),
        })
          .then(async (res) =>
            res.json().then(async (res) => {
              console.log("received data after create", res);

              await fetchUsers()
                .then(() => {
                  console.log("successfully updated users list");
                })
                .catch((error) => {
                  console.log(
                    "an error has occured when updating users",
                    error
                  );
                });
              navigate("/access-management");
            })
          )
          .catch((error) => {
            console.log("an error has occured when creating a user", error);
          });
      }
    }
  };

  const handleDelete = async (event) => {
    event?.preventDefault();

    if (window.confirm("Voulez-vous supprimer l'utilisateur ?")) {
      await lookup(`${BASE_URL}/api/users/${currUserId}`, {
        headers: getHeaders({}),
        method: "DELETE",
      })
        .then((res) =>
          res.json().then(async (res) => {
            console.log("received data after user deletion", res);

            await fetchUsers()
              .then(() => {
                console.log("successfully updated users list");
              })
              .catch((error) => {
                console.log("an error has occured when updating users", error);
              });
            navigate("/access-management");
          })
        )
        .catch((error) => {
          console.log("an error has occured when removing a user", error);
        });
    }
  };

  const Form = () => {
    return (
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: theme?.palette?.common?.white,
          width: "100%",
          padding: "1rem",
          borderRadius: "1rem",
        }}
      >
        <Grid
          container
          sx={{
            width: "100%",
          }}
        >
          {fields?.map((target, index) => {
            return (
              <Grid
                item
                key={index}
                xs={12}
                sm={6}
                sx={{
                  p: ".5rem",
                }}
              >
                {target?.field === "role" ? (
                  <FormControl
                    variant="outlined"
                    sx={{ width: "100%" }}
                    size={"small"}
                    autoComplete="off"
                  >
                    <InputLabel>{target?.title}</InputLabel>
                    <Select
                      size={"small"}
                      labelId="demo-simple-select-standard-label"
                      id="demo-simple-select-standard"
                      label={target?.title}
                      placeholder={target?.title}
                      name={target?.field}
                      defaultValue={
                        (editMode ? defaultUser["role"] : null) || null
                      }
                      required={target?.required}
                      // autoComplete="off"
                    >
                      {roles?.map((role) => {
                        return (
                          <MenuItem value={role?.id}>{role?.name}</MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    name={target?.field}
                    placeholder={target?.title}
                    type={
                      target?.field === "password"
                        ? "password"
                        : target?.field === "email"
                        ? "email"
                        : "text"
                    }
                    size={"small"}
                    // autoComplete="new-password"
                    sx={{
                      width: "100%",
                    }}
                    defaultValue={
                      target?.field === "password"
                        ? null
                        : (editMode
                            ? defaultUser[
                                target?.field === "username"
                                  ? "fullName"
                                  : target.field
                              ]
                            : null) || null
                    }
                    required={target?.required}
                    // inputProps={{
                    //   autocomplete: "new-password",
                    //   form: {
                    //     autocomplete: "off",
                    //   },
                    // }}
                  />
                )}
              </Grid>
            );
          })}
        </Grid>

        <Stack
          direction={"row"}
          sx={{
            alignItems: "center",
            mb: "1rem",
          }}
        >
          <button
            type="submit"
            style={{
              paddingLeft: "2rem",
              paddingRight: "2rem",
              paddingTop: ".4rem",
              paddingBottom: ".4rem",
              marginTop: "1rem",
              marginLeft: ".5rem",
              maxWidth: "max-content",
            }}
            className="btn-primary flex-auto"
          >
            {editMode ? "Mettre à jour" : "Créer"}
          </button>
          {editMode ? (
            <button
              onClick={handleDelete}
              type="submit"
              style={{
                paddingLeft: "2rem",
                paddingRight: "2rem",
                paddingTop: ".4rem",
                paddingBottom: ".4rem",
                marginTop: "1rem",
                marginLeft: ".5rem",
                maxWidth: "max-content",
                backgroundColor: theme?.palette?.error?.main,
              }}
              className="btn-primary flex-auto"
            >
              Suprimer
            </button>
          ) : null}
        </Stack>
      </form>
    );
  };

  return (
    <Layout>
      <Box
        sx={{
          p: "1rem",
        }}
      >
        <NavigationLine
          firstTitle={"Utilisateurs"}
          secondTitle={editMode ? "Modification" : "Ajout"}
        />

        {editMode ? Object.keys(defaultUser)?.length > 0 && <Form /> : <Form />}
      </Box>
    </Layout>
  );
};

export default InvitedUser;
