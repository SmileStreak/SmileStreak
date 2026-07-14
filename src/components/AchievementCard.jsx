export default function AchievementCard({ title, description }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
