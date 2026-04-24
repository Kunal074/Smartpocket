import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';

export default function GroupCard({ group }) {
  const { id, name, icon, color, member_count, description } = group;

  return (
    <Link
      href={`/dashboard/groups/${id}`}
      className="glass group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all hover:scale-[1.02] hover:shadow-glow"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0" />

      <div>
        <div className="flex items-center justify-between">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
            style={{ backgroundColor: color || 'var(--primary)' }}
          >
            <span className="text-2xl">{icon || '⭐'}</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/50 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-foreground">
          {name}
        </h3>
        
        {description && (
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {member_count} {member_count === 1 ? 'member' : 'members'}
        </div>
        
        {/* We will add balances here later if passed down */}
        <div className="text-xs font-semibold text-primary">
          View details
        </div>
      </div>
    </Link>
  );
}
