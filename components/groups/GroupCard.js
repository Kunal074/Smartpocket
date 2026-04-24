import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';

export default function GroupCard({ group }) {
  const { id, name, icon, color, member_count, description, type } = group;

  const TYPE_EMOJI = {
    trip: '✈️', home: '🏠', office: '💼', couple: '💑', custom: '⭐', business: '📊',
  };

  const displayIcon = icon || TYPE_EMOJI[type] || '⭐';

  return (
    <Link
      href={`/dashboard/groups/${id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: 'rgba(12, 31, 48, 0.9)',
        border: '1px solid rgba(73,152,214,0.15)',
      }}
    >
      {/* Subtle hover glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: 'inset 0 0 40px rgba(73,152,214,0.05)', border: '1px solid rgba(73,152,214,0.3)' }}
      />

      <div>
        <div className="flex items-start justify-between">
          {/* Group icon */}
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
            style={{
              background: color
                ? `${color}22`
                : 'rgba(73,152,214,0.12)',
              border: `1px solid ${color ? `${color}44` : 'rgba(73,152,214,0.2)'}`,
            }}
          >
            {displayIcon}
          </div>

          {/* Arrow */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 group-hover:scale-110"
            style={{
              background: 'rgba(73,152,214,0.1)',
              border: '1px solid rgba(73,152,214,0.2)',
            }}
          >
            <ArrowRight className="h-4 w-4" style={{ color: '#4998d6' }} />
          </div>
        </div>

        <h3
          className="mt-4 font-display text-base font-bold tracking-tight"
          style={{ color: '#cfe2f9' }}
        >
          {name}
        </h3>

        {description && (
          <p className="mt-1 line-clamp-1 text-xs" style={{ color: 'rgba(136,189,242,0.5)' }}>
            {description}
          </p>
        )}
      </div>

      <div
        className="mt-5 flex items-center justify-between border-t pt-4"
        style={{ borderColor: 'rgba(73,152,214,0.1)' }}
      >
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'rgba(136,189,242,0.55)' }}>
          <Users className="h-3.5 w-3.5" />
          {member_count} {member_count === 1 ? 'member' : 'members'}
        </div>
        <span className="text-xs font-semibold" style={{ color: '#4998d6' }}>
          View →
        </span>
      </div>
    </Link>
  );
}
