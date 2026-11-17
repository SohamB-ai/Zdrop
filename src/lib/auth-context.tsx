'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { UserProfile, ShopProfile } from './types';

interface AuthContextType {
  user: UserProfile | null;
  shop: ShopProfile | null;
  isLoading: boolean;
  isShopOwner: boolean;
  refreshShop: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const clerk = useClerk();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [isShopLoading, setIsShopLoading] = useState(false);

  const fetchShop = useCallback(async (ownerId: string) => {
    setIsShopLoading(true);
    try {
      const res = await fetch(`/api/shops?ownerId=${encodeURIComponent(ownerId)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setShop(data.shop || null);
      } else {
        setShop(null);
      }
    } catch {
      setShop(null);
    } finally {
      setIsShopLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      fetchShop(clerkUser.id);
    } else {
      setShop(null);
    }
  }, [isSignedIn, clerkUser, fetchShop]);

  const user: UserProfile | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress || 'User',
        avatarUrl: clerkUser.imageUrl,
        role: (clerkUser.publicMetadata?.role as 'user' | 'shop_owner') || (shop ? 'shop_owner' : 'user'),
        shopId: shop?.id,
      }
    : null;

  const isShopOwner = Boolean(shop || user?.role === 'shop_owner');

  const logout = async () => {
    await clerk.signOut({ redirectUrl: '/' });
  };

  const refreshShop = async () => {
    if (clerkUser) {
      await fetchShop(clerkUser.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        isLoading: !isLoaded || isShopLoading,
        isShopOwner,
        refreshShop,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
