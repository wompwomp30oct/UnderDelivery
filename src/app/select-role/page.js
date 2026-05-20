'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import RoleSelector from '@/components/auth/RoleSelector';
import Loader from '@/components/ui/Loader';
import './select-role.css';

export default function SelectRolePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="page-loader">
        <Loader size="lg" />
      </div>
    );
  }

  return <RoleSelector role={profile?.role} />;
}
