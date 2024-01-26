// headers utility function definition

const getHeaders = ({}) => {
  const headers = new Headers();

  headers.append("Content-Type", "application/json");

  // headers.append("Accept", "application/json");

  headers?.append(
    `Authorization`,
    `Bearer ${sessionStorage?.getItem("token")}`
  );

  return headers;
};

export default getHeaders;
