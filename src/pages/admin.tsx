import React from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { withAuth } from '@/components/auth/withAuth';

const AdminPage: React.FC = () => {
  return <AdminDashboard />;
};

export default withAuth(AdminPage, { admin: true });