export default function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}>
      {title && <h2 className="text-base font-semibold text-gray-700 mb-4">{title}</h2>}
      {children}
    </div>
  )
}
