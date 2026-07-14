export default function ProgressBar({ percent = 0 }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div
        className="bg-green-500 h-full transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
