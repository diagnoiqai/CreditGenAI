import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useAuthContext();
  
  return {
    ...context,
    user: context.profile ? { uid: context.profile.uid, email: context.profile.email } : null,
  };
}
