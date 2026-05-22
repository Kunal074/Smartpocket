'use client';

import {
  ShoppingCart,
  House,
  Car,
  ForkKnife,
  DeviceMobile,
  CreditCard,
  GraduationCap,
  Ticket,
  Heartbeat,
  Gift,
  Briefcase,
  Sparkle
} from '@phosphor-icons/react';

const ICON_MAP = {
  groceries: ShoppingCart,
  rent: House,
  transport: Car,
  food: ForkKnife,
  bills: DeviceMobile,
  emi: CreditCard,
  education: GraduationCap,
  entertainment: Ticket,
  health: Heartbeat,
  gifts: Gift,
  salary: Briefcase,
  others: Sparkle
};

export default function CategoryIcon({ id, className = 'h-5 w-5', fallback = Sparkle }) {
  const IconComponent = ICON_MAP[id] || fallback;
  return <IconComponent className={className} />;
}
