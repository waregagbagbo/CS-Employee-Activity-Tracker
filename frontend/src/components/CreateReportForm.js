import { useState } from "react";
import { createReport } from "../services/reports";
import { useNavigate } from "react-router-dom";

export default function CreateReportForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createReport(form);
      navigate("/reports");
    } catch (err) {
      console.error("Report creation failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl space-y-4">
      <h2 className="font-black text-xl">Create Activity Report</h2>

      <input
        name="title"
        placeholder="Title"
        onChange={handleChange}
        className="w-full p-3 border rounded-xl"
        required
      />

      <textarea
        name="description"
        placeholder="What did you work on?"
        onChange={handleChange}
        className="w-full p-3 border rounded-xl"
        rows={5}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-6 py-3 rounded-xl font-black"
      >
        {loading ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}
