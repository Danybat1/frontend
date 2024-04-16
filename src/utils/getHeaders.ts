// headers utility function definition

const getHeaders = ({contentType = "application/json"}) => {
  const headers = new Headers();

  headers.append("Content-Type", contentType);

  // headers.append("Accept", "application/json");

  headers?.append(
    `Authorization`,
    `Bearer ${sessionStorage?.getItem("token")}`
  );

  return headers;
};

export default getHeaders;
