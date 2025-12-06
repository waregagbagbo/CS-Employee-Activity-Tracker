import API from "./api";

export const fetchDepartments = async () => {
  const response = await API.get("/departments/");
  return response.data;
};