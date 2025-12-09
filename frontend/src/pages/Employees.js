import React, { useState, useEffect } from "react";
import { listEmployees } from "../services/employee";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  useEffect(() => {
    fetchEmployees(page);
  }, [page]);

  const fetchEmployees = async (pageNumber) => {
    setLoading(true);
    setError("");
    try {
      const response = await listEmployees({ page: pageNumber });
      console.log("Employee API response:", response.data);

      setEmployees(response.data.results);
      setNextPage(response.data.next);
      setPrevPage(response.data.previous);
    } catch (err) {
      console.error("Employee fetch error:", err.response || err);
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => prevPage && setPage(page - 1);
  const handleNext = () => nextPage && setPage(page + 1);

  if (loading)
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-red-500">
        <p>{error}</p>
      </div>
    );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Employees</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white p-4 rounded shadow hover:shadow-lg transition duration-200"
          >
            <h3 className="text-xl font-semibold">{emp.full_name}</h3>
            <p className="text-gray-600">Email: {emp.email}</p>
            <p className="text-gray-600">
              Department: {emp.department_name || "N/A"}
            </p>
          </div>
        ))}
      </div>

      {/* Pagination Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrev}
          disabled={!prevPage}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!nextPage}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
