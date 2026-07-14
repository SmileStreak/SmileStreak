import { CheckCircle, Circle } from "lucide-react";

export default function TaskRow({ title, description, completed, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all
        ${completed
          ? "bg-green-50 border-green-200"
          : "bg-white border-gray-200 hover:bg-gray-50"
        }`}
    >
      {completed ? (
        <CheckCircle className="w-7 h-7 text-green-500" />
      ) : (
        <Circle className="w-7 h-7 text-gray-300" />
      )}

      <div className="flex-1 text-left">
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </button>
  );
}
