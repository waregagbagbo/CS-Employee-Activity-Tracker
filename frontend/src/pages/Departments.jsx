import React, { useEffect, useState } from "react";
import { fetchDepartments } from "../services/department" // adjust path if needed
import { Loader2 } from "lucide-react";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await fetchDepartments();
        setDepartments(data);
      } catch (err) {
        setError("Failed to load departments");
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6">Departments</h2>

      {departments.length === 0 ? (
        <p className="text-gray-600">No departments found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition border"
            >
              <h3 className="text-xl font-semibold mb-2">{dept.name}</h3>
              {dept.description && (
                <p className="text-gray-700 text-sm mb-3">{dept.description}</p>
              )}

              <p className="text-sm text-gray-600">
                <span className="font-medium">Created:</span>{" "}
                {new Date(dept.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
