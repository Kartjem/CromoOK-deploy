import {
  MapPin,
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  Map,
  BarChart2,
  Brain,
  Settings,
  Filter,
  Car,
  PenTool,
  CalendarRange,
  ShieldCheck,
  ClipboardCheck,
  ListTodo,
  BanknoteIcon,
  Clock,
  UserPlus,
  LayoutDashboard,
  Building2,
  Shield,
  UserCog,
  Calculator,
  CreditCard as PaymentIcon,
  Percent,
  FileSpreadsheet,
  MessageCircle,
  Bell,
  Star,
  MapPinned,
  Navigation,
  LineChart,
  TrendingUp,
  UserSquare,
  FileBarChart,
  Sparkles,
  FileText,
  Palette,
  ScanSearch,
  GitBranch,
  Lock,
  HardDrive,
  Scale,
  FileCheck
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Locations",
      url: "#",
      icon: MapPin,
      items: [
        { title: "Search and Filters", url: "#", icon: Filter },
        { title: "Location Card", url: "#", icon: Car },
        { title: "Adding and Editing", url: "#", icon: PenTool },
        { title: "Availability Calendar", url: "#", icon: CalendarRange },
        { title: "Moderation", url: "#", icon: ShieldCheck },
      ],
    },
    {
      title: "Booking",
      url: "#",
      icon: Calendar,
      items: [
        { title: "Request and Confirmation", url: "#", icon: ClipboardCheck },
        { title: "Status Management", url: "#", icon: ListTodo },
        { title: "Cancellation and Refund", url: "#", icon: BanknoteIcon },
        { title: "Shooting Schedule", url: "#", icon: Clock },
      ],
    },
    {
      title: "Users",
      url: "#",
      icon: Users,
      items: [
        { title: "Registration and Login", url: "#", icon: UserPlus },
        { title: "Customer Dashboard", url: "#", icon: LayoutDashboard },
        { title: "Owner Dashboard", url: "#", icon: Building2 },
        { title: "Admin Panel", url: "#", icon: Shield },
        { title: "Roles and Permissions", url: "#", icon: UserCog },
      ],
    },
    {
      title: "Payments",
      url: "#",
      icon: CreditCard,
      items: [
        { title: "Cost Calculation", url: "#", icon: Calculator },
        { title: "Payment System Integration", url: "#", icon: PaymentIcon },
        { title: "Platform Commission", url: "#", icon: Percent },
        { title: "Financial Reporting", url: "#", icon: FileSpreadsheet },
      ],
    },
    {
      title: "Communication",
      url: "#",
      icon: MessageSquare,
      items: [
        { title: "Built-in Chat", url: "#", icon: MessageCircle },
        { title: "Notifications", url: "#", icon: Bell },
        { title: "Reviews and Ratings", url: "#", icon: Star },
      ],
    },
    {
      title: "Map",
      url: "#",
      icon: Map,
      items: [
        { title: "Map Integration", url: "#", icon: MapPinned },
        { title: "Location Display", url: "#", icon: Map },
        { title: "Route Building", url: "#", icon: Navigation },
      ],
    },
    {
      title: "Analytics",
      url: "#",
      icon: BarChart2,
      items: [
        { title: "Statistics and Reports", url: "#", icon: LineChart },
        { title: "Location Popularity", url: "#", icon: TrendingUp },
        { title: "User Behavior", url: "#", icon: UserSquare },
        { title: "Admin Reports", url: "#", icon: FileBarChart },
      ],
    },
    {
      title: "AI / ML",
      url: "#",
      icon: Brain,
      items: [
        { title: "Recommendations", url: "#", icon: Sparkles },
        { title: "Description Generation", url: "#", icon: FileText },
        { title: "Style-based Matching", url: "#", icon: Palette },
        { title: "Object Recognition", url: "#", icon: ScanSearch },
      ],
    },
    {
      title: "System Capabilities",
      url: "#",
      icon: Settings,
      items: [
        { title: "CI/CD", url: "#", icon: GitBranch },
        { title: "Security and Access", url: "#", icon: Lock },
        { title: "Storage and Files", url: "#", icon: HardDrive },
        { title: "Scalability", url: "#", icon: Scale },
        { title: "GDPR Compliance", url: "#", icon: FileCheck },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}