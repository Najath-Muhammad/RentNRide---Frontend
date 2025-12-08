import React from "react";
import { AdminSidebar } from "../../components/admin/AdminSidebar";
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

interface StatCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  color: string;
}

const DashboardPage: React.FC = () => {
  const stats: StatCard[] = [
    {
      title: "Total Users",
      value: "2,543",
      change: "+12.5%",
      isPositive: true,
      icon: <Users size={24} />,
      color: "bg-blue-500"
    },
    {
      title: "Total Products",
      value: "1,234",
      change: "+8.2%",
      isPositive: true,
      icon: <ShoppingBag size={24} />,
      color: "bg-emerald-500"
    },
    {
      title: "Revenue",
      value: "$45,678",
      change: "+23.1%",
      isPositive: true,
      icon: <DollarSign size={24} />,
      color: "bg-purple-500"
    },
    {
      title: "Active Orders",
      value: "89",
      change: "-5.4%",
      isPositive: false,
      icon: <Activity size={24} />,
      color: "bg-orange-500"
    }
  ];

  const recentActivities = [
    { id: 1, user: "John Doe", action: "Purchased Premium Plan", time: "2 mins ago" },
    { id: 2, user: "Jane Smith", action: "Registered new account", time: "15 mins ago" },
    { id: 3, user: "Mike Johnson", action: "Updated profile", time: "1 hour ago" },
    { id: 4, user: "Sarah Williams", action: "Made a purchase", time: "2 hours ago" },
    { id: 5, user: "Tom Brown", action: "Left a review", time: "3 hours ago" }
  ];

  const topProducts = [
    { id: 1, name: "Premium Membership", sales: 234, revenue: "$11,700" },
    { id: 2, name: "Basic Plan", sales: 189, revenue: "$5,670" },
    { id: 3, name: "Pro Tools", sales: 156, revenue: "$7,800" },
    { id: 4, name: "Enterprise Plan", sales: 98, revenue: "$19,600" },
    { id: 5, name: "Starter Pack", sales: 87, revenue: "$2,610" }
  ];
  const {user} = useAuthStore.getState()
  console.log(user)

  return (
    <div>
      <AdminSidebar activeItem="Dashboard" />
    </div>
  );
};

export default DashboardPage;