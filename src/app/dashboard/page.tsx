'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { computeOkrStats } from './okrStatsFromOkrs';
import { enrichOwnersWithUserData } from '../../lib/enrichOwnersWithUserData';
import type { Okr } from './okrSelectors';
import { selectOverdueOkrs } from './okrInsights';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, Loader2, RefreshCw, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Define types for our dashboard data
interface OkrStats {
  total: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  completed: number;
}

interface DashboardData {
  okrStats: OkrStats;
  upcomingDeadlines: any[];
  recentActivity: any[];
  teamOkrStatus?: OkrStats;
  user: {
    name: string;
    role: string;
    department: string;
  };
}

// Extend the session type to include our custom properties
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      department: string;
    };
  }
}

// Skeleton component for loading state
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      <Skeleton className="col-span-4 h-80" />
      <Skeleton className="col-span-3 h-80" />
    </div>
  </div>
);

export default function DashboardPage() {
  // SessionStatus type removed as unused
  const router = useRouter();

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/auth/login';
    },
  }) as { data: any, status: 'loading' | 'authenticated' | 'unauthenticated' };

  // router is not used
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [okrs, setOkrs] = useState<Okr[]>([]); // Holds all OKRs for stats calculation
  const [users, setUsers] = useState<{ _id: string; name?: string; avatarUrl?: string }[]>([]); // For avatar enrichment
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Function to fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    // Only fetch if authenticated
    if (status !== 'authenticated' || !session) {
      console.log('Not authenticated or session not available, skipping fetch');
      return;
    }

    try {
      setError(null);
      // Only show loading indicator if not a refresh
      if (!isRefreshing) setLoading(true);

      // Fetch all OKRs for stats
      const okrsRes = await fetch('/api/okrs', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store' as RequestCache
      });
      if (!okrsRes.ok) throw new Error('Failed to fetch OKRs');
      const okrsRaw = await okrsRes.json();

      // Fetch users for avatar enrichment, as in OKRsPage
      const usersRes = await fetch('/api/users');
      if (!usersRes.ok) throw new Error('Failed to fetch users');
      const usersArr = await usersRes.json();

      setUsers(usersArr);
      // Enrich owners and filter out archived/deleted (match OKRsPage logic)
      const enrichedOkrs = (Array.isArray(okrsRaw.okrs) ? okrsRaw.okrs : Array.isArray(okrsRaw) ? okrsRaw : []).map((okr: any) => {
        // Find creator user object
        const creator = usersArr.find((u: any) => u._id === (okr.createdBy || okr.userId));
        return {
          ...okr,
          owners: (okr.owners && okr.owners.length > 0)
            ? okr.owners.map((owner: any) => {
                if (typeof owner === 'string') {
                  const user = usersArr.find((u: any) => u._id === owner);
                  return user ? { _id: user._id, name: user.name, avatarUrl: user.avatarUrl } : { _id: owner };
                }
                // Already an object
                if (owner && owner._id) {
                  const user = usersArr.find((u: any) => u._id === owner._id);
                  return user ? { ...owner, name: user.name, avatarUrl: user.avatarUrl } : owner;
                }
                return owner;
              })
            : [],
          createdBy: creator?._id || okr.createdBy || okr.userId || '',
          createdByName: creator?.name || '',
          createdByAvatarUrl: creator?.avatarUrl || '',
          createdByInitials: creator?.name ? creator.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase() : ''
        };
      });
      const filteredOkrs = enrichedOkrs.filter((okr: any) => okr.status !== 'archived' && okr.status !== 'deleted');
      setOkrs(filteredOkrs);

      // Compute stats using selectors utility
      const okrStats: OkrStats = computeOkrStats(filteredOkrs);

      // Fetch dashboard data for other sections (deadlines, activity, user info)
      const response = await fetch('/api/dashboard', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
        cache: 'no-store' as RequestCache
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorMessage = 'Failed to fetch dashboard data';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json().catch((e: Error) => {
        console.error('Failed to parse response JSON:', e);
        throw new Error('Invalid response from server');
      });
      
      console.log('Dashboard data received:', data);
      
      // Validate the data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format received from server');
      }
      
      // Ensure required fields exist
      const requiredFields = ['okrStats', 'user'];
      for (const field of requiredFields) {
        if (!(field in data)) {
          throw new Error(`Missing required field in response: ${field}`);
        }
      }
      
      setDashboardData({
  ...data,
  okrStats // Replace stats with selector-based calculation
});
      
      if (isRefreshing) {
        toast.success('Dashboard updated');
      }
      
      return data;
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Set default data on error to prevent UI from breaking
      setDashboardData({
        okrStats: { total: 0, onTrack: 0, atRisk: 0, offTrack: 0, completed: 0 },
        upcomingDeadlines: [],
        recentActivity: [],
        user: { name: 'User', role: 'user', department: 'General' }
      });
      
      return null;
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing, status, session]);
  
  // Handle session states
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Session is authenticated, fetching dashboard data...');
      fetchDashboardData().finally(() => {
        setInitialLoad(false);
      });
    } else if (status === 'unauthenticated') {
      console.log('User is not authenticated, redirecting to login...');
      window.location.href = '/auth/login';
    }
  }, [status, fetchDashboardData]);
  
  // Show loading state until we know if we're authenticated or not
  if (status === 'loading' || (status === 'authenticated' && initialLoad)) {
    return (
      <div className="container mx-auto p-6">
        <DashboardSkeleton />
      </div>
    );
  }



  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'on_track': return 'default';
      case 'at_risk': return 'warning';
      case 'off_track': return 'destructive';
      case 'completed': return 'success';
      default: return 'outline';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return 'Unknown';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading && !initialLoad) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access the dashboard</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/auth/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Try Again'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>Unable to load dashboard data</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {dashboardData.user.name}
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm" 
          disabled={isRefreshing}
          className="gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stats widgets always at top */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total OKRs</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.okrStats.total}</div>
            <p className="text-xs text-muted-foreground">Across all statuses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <div className="h-4 w-4 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {dashboardData.okrStats.onTrack}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.okrStats.total > 0
                ? `${Math.round((dashboardData.okrStats.onTrack / dashboardData.okrStats.total) * 100)}% of total`
                : 'No OKRs yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <div className="h-4 w-4 text-amber-500">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {dashboardData.okrStats.atRisk}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="h-4 w-4 text-sky-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-500">
              {dashboardData.okrStats.completed}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.okrStats.total > 0
                ? `${Math.round((dashboardData.okrStats.completed / dashboardData.okrStats.total) * 100)}% of total`
                : 'No OKRs yet'}
            </p>
          </CardContent>
        </Card>
      </div>

     {/* Overdue OKRs Widget now below stats row */}
      {okrs && okrs.length > 0 && (
        <Card className="mb-6 bg-white border border-neutral-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <AlertCircle className="inline-block h-5 w-5 text-red-500" />
                Overdue OKRs
              </CardTitle>
              <CardDescription className="text-sm mt-1 text-muted-foreground">
                These OKRs are past their due date and need immediate attention.
              </CardDescription>
            </div>
            <div className="rounded-full bg-neutral-100 text-neutral-700 px-3 py-1 text-sm font-bold border border-neutral-200">
              {selectOverdueOkrs(okrs).length} overdue
            </div>
          </CardHeader>
          <CardContent>
            {selectOverdueOkrs(okrs).length === 0 ? (
              <div className="text-muted-foreground text-center py-4">No overdue OKRs!</div>
            ) : (
              <ul className="space-y-3">
                {selectOverdueOkrs(okrs)
                  .sort((a, b) => new Date(a.endDate || '').getTime() - new Date(b.endDate || '').getTime())
                  .slice(0, 5)
                  .map(okr => {
                    // Enrich all owners for this OKR
                    const enrichedOwners = enrichOwnersWithUserData(okr.owners || [], users);
                    return (
                      <li
                        key={okr._id}
                        className="flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-3 border border-neutral-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-shadow"
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for OKR: ${okr.objective}`}
                        onClick={() => router.push(`/okrs/${'slug' in okr && okr.slug ? okr.slug : (okr.objective || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${okr._id}`)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/okrs/${'slug' in okr && okr.slug ? okr.slug : (okr.objective || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${okr._id}`);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* All owner avatars */}
                          <div className="flex -space-x-2">
                            {enrichedOwners.length > 0 ? (
                              enrichedOwners.map((owner, idx) => {
                                const initials = owner?.name && owner.name !== 'User'
                                  ? owner.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
                                  : 'U';
                                return owner.avatarUrl ? (
                                  <img
                                    key={owner._id + idx}
                                    src={owner.avatarUrl}
                                    alt={owner.name || 'Owner'}
                                    className="h-8 w-8 rounded-full object-cover border-2 border-white shadow"
                                  />
                                ) : (
                                  <div
                                    key={owner._id + idx}
                                    className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 font-bold border-2 border-white shadow"
                                  >
                                    {initials}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 font-bold border-2 border-white shadow">
                                U
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate text-base text-neutral-900">{okr.objective}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              Owner{enrichedOwners.length !== 1 ? 's' : ''}: {enrichedOwners.length > 0 ? enrichedOwners.map(o => o.name && o.name !== 'User' ? o.name : 'Unassigned').join(', ') : 'Unassigned'}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-neutral-100 text-neutral-700 text-xs font-semibold border border-neutral-200">
                            Due {okr.endDate ? new Date(okr.endDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 bg-white border border-neutral-200 shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>
              {dashboardData.upcomingDeadlines.length > 0
                ? `Next ${dashboardData.upcomingDeadlines.length} upcoming deadlines`
                : 'No upcoming deadlines'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.upcomingDeadlines.length > 0 ? (
              <ul className="space-y-3">
                {dashboardData.upcomingDeadlines.map((deadline, index) => (
                  <li key={index} className="flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-3 border border-neutral-100">
                    <div className="min-w-0">
                      <div className="font-medium truncate text-base text-neutral-900">{deadline.objective}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Due {new Date(deadline.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded bg-neutral-100 text-neutral-700 text-xs font-semibold border border-neutral-200">
                      {formatStatus(deadline.status)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No upcoming deadlines</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-white border border-neutral-200 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {dashboardData.recentActivity.length > 0
                ? 'Latest updates on your OKRs'
                : 'No recent activity'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.recentActivity.length > 0 ? (
              <ul className="space-y-3">
                {dashboardData.recentActivity.map((activity, index) => (
                  <li key={index} className="flex items-start gap-3 bg-neutral-50 rounded-lg px-4 py-3 border border-neutral-100">
                    <div className="flex-shrink-0">
                      {activity.user?.avatarUrl ? (
                        <img
                          src={activity.user.avatarUrl}
                          alt={activity.user.name || 'User'}
                          className="h-8 w-8 rounded-full object-cover border-2 border-white shadow"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-neutral-700">
                            {activity.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="font-medium truncate text-neutral-900 text-sm">{activity.message}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}