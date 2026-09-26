"use client";

import {
  ArrowLeft, ArrowRight, BarChart3, Bed, Book, BookOpen, BookOpenText, BarChart, Brain, Briefcase,
  Calendar, CalendarDays, Check, CheckCheck, CheckCircle2, ChevronsDown, ChevronsUp,
  ChevronLeft, ChevronRight, CircleDot, Clock, ExternalLink, FileText, Film, Flame, Footprints, GraduationCap, Hourglass,
  ImagePlus, LayoutDashboard, Link as LinkIcon, ListChecks, Lock, Minimize2, Moon, NotebookPen,
  PanelsTopLeft, Pause, Pin, PinOff, Play, Plus, Rocket, RotateCcw,
  ShieldCheck, Tags, Target, Timer, Trash2, TrendingUp, Trophy, Type, X, Zap, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "bar-chart": BarChart,
  "bar-chart-3": BarChart3,
  bed: Bed,
  book: Book,
  "book-open": BookOpen,
  "book-open-text": BookOpenText,
  brain: Brain,
  briefcase: Briefcase,
  calendar: Calendar,
  "calendar-days": CalendarDays,
  check: Check,
  "check-check": CheckCheck,
  "check-circle-2": CheckCircle2,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevrons-down": ChevronsDown,
  "chevrons-up": ChevronsUp,
  "circle-dot": CircleDot,
  clock: Clock,
  "external-link": ExternalLink,
  "file-text": FileText,
  film: Film,
  flame: Flame,
  footprints: Footprints,
  "graduation-cap": GraduationCap,
  hourglass: Hourglass,
  "image-plus": ImagePlus,
  "layout-dashboard": LayoutDashboard,
  link: LinkIcon,
  "list-checks": ListChecks,
  lock: Lock,
  "minimize-2": Minimize2,
  moon: Moon,
  "notebook-pen": NotebookPen,
  "panels-top-left": PanelsTopLeft,
  pause: Pause,
  pin: Pin,
  "pin-off": PinOff,
  play: Play,
  plus: Plus,
  rocket: Rocket,
  "rotate-ccw": RotateCcw,
  "shield-check": ShieldCheck,
  tags: Tags,
  target: Target,
  timer: Timer,
  "trash-2": Trash2,
  "trending-up": TrendingUp,
  trophy: Trophy,
  type: Type,
  x: X,
  zap: Zap,
};

interface Props {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 18, strokeWidth = 2, className, style }: Props) {
  const Component = ICONS[name];
  if (!Component) {
    return <span className={className} style={{ width: size, height: size, display: "inline-block" }} />;
  }
  return <Component size={size} strokeWidth={strokeWidth} className={className} style={style} aria-hidden="true" />;
}
