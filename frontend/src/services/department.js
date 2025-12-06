import API from "./api";

export const fetchDepartments = async () => {
  const response = await API.get("cs/departments/");
  return response.data;
};