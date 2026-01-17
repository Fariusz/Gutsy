import React, { useState } from "react";

export default function SimpleLogForm() {
  const [ingredients, setIngredients] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Form submitted! Ingredients: ${ingredients}`);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Simple Log Form (Test)</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ingredients-input" className="block text-sm font-medium text-gray-700 mb-1">
            Ingredients
          </label>
          <input
            id="ingredients-input"
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter ingredients..."
            required
          />
        </div>
        <div>
          <label htmlFor="notes-textarea" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows={3}
            placeholder="Add notes..."
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Submit Test Form
        </button>
      </form>
    </div>
  );
}
