import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentMaterials from '../../pages/student/Materials';
import AdminMaterials from '../../pages/admin/MaterialsManagement';

const MaterialsWrapper = () => {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminMaterials /> : <StudentMaterials />;
};

export default MaterialsWrapper;
