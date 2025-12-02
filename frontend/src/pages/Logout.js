import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await logoutUser(); // call DRF logout
      } catch (err) {
        // even if error, just clear token
      }

      localStorage.removeItem("token"); // remove token
      navigate("/login"); // redirect to login
    };

    doLogout();
  }, [navigate]);

  return null; // nothing to render
}
