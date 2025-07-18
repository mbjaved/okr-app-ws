import React from 'react';
import { notFound } from 'next/navigation';
import { OkrDetailsActions } from './OkrDetailsActions.client';
import { CommentSection } from '@/components/okr/CommentSection';


// Robustly extract MongoDB ObjectId from slug or [slug]-[id] pattern
function extractId(slugAndId: string): string | null {
  if (!slugAndId) return null;
  // Match either -[24 hex] at end or just 24 hex
  const match = slugAndId.match(/([a-fA-F0-9]{24})$/);
  return match ? match[1] : null;
}

// Fetch OKR by ID with cookies for SSR authentication
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function fetchOkrById(id: string, cookie: string) {
  const url = `${BASE_URL}/api/okrs/${id}`;
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[SSR fetchOkrById]', { id, url, cookie });
  }
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { cookie }
  });
  const contentType = res.headers.get('content-type');
  if (!res.ok) {
    let errMsg = 'Not found';
    try {
      if (contentType && contentType.includes('application/json')) {
        const json = await res.json();
        errMsg = JSON.stringify(json);
      } else {
        errMsg = await res.text();
      }
    } catch {}
    throw new Error(`SSR fetch error: ${errMsg} (status ${res.status})`);
  }
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  } else {
    const text = await res.text();
    throw new Error(`SSR fetch non-JSON response: ${text}`);
  }
}

// Next.js 15+ dynamic route: await params and cookies
export default async function Page(context: any) {
  let users: any[] = [];
  let sessionUserId: string | null = null;
  let currentUser: any = null;
  const params = await context.params;
  // Patch: cookies() returns a ReadonlyRequestCookies object, not a string
  const cookiesApi = await import('next/headers').then(m => m.cookies());
  // Fix: Use getAll() to get cookies as array of {name, value}
  const cookieString = cookiesApi.getAll().map(({name, value}) => `${name}=${value}`).join('; ');
  const id = extractId(params.slugAndId);

  // Debug: Traceability comment with local time
  // SSR TRACE: Local time at render: 2025-07-02T14:42:53+04:00

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[OKR DETAILS SSR]', {
      slugAndId: params.slugAndId,
      extractedId: id,
      cookieString,
      params,
      context
    });
  }
  if (!id) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[OKR DETAILS SSR] No valid ObjectId extracted from slugAndId', { slugAndId: params.slugAndId });
    }
    return notFound();
  }

  let okr: any = null;
  let error = '';
  try {
    okr = await fetchOkrById(id, cookieString);
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[OKR DETAILS SSR] OKR fetch result', { okr });
    }
    // SSR: Fetch users and enrich owners for avatar display
    const usersRes = await fetch(`${BASE_URL}/api/users`, { headers: { cookie: cookieString } });
    users = usersRes.ok ? await usersRes.json() : [];
    const { enrichOwnersWithUserData } = await import('../../../lib/enrichOwnersWithUserData');
    if (okr.owners && Array.isArray(okr.owners)) {
      okr.owners = enrichOwnersWithUserData(okr.owners, users);
    }
    // SSR: Fetch current user for permission logic
    let sessionUser = null;
    try {
      const currentUserRes = await fetch(`${BASE_URL}/api/users/current`, { headers: { cookie: cookieString } });
      if (process.env.NODE_ENV !== 'production') {
        console.log('[OKR DETAILS SSR] Current user fetch result:', {
          status: currentUserRes.status,
          ok: currentUserRes.ok,
          cookieString: cookieString.substring(0, 100) + '...'
        });
      }
      if (currentUserRes.ok) {
        sessionUser = await currentUserRes.json();
        sessionUserId = sessionUser._id?.toString?.() || null;
        currentUser = sessionUser;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[OKR DETAILS SSR] Current user set:', { currentUser: !!currentUser, sessionUserId });
        }
      } else {
        const errorText = await currentUserRes.text();
        if (process.env.NODE_ENV !== 'production') {
          console.error('[OKR DETAILS SSR] Current user fetch failed:', { status: currentUserRes.status, error: errorText });
        }
      }
    } catch (fetchError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[OKR DETAILS SSR] Current user fetch exception:', fetchError);
      }
    }
  } catch (err: any) {
    error = err.message || 'Not found';
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[OKR DETAILS SSR] Fetch error', {
        error,
        id,
        cookieString,
        slugAndId: params.slugAndId,
        err
      });
    }
  }

  if (error) {
    if (error.toLowerCase().includes('not found')) return notFound();
    return (
      <main className="container mx-auto p-6 max-w-3xl">
        <div className="bg-white border border-red-200 rounded-xl shadow-sm p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600">Error loading OKR</h1>
          <div className="text-neutral-500 mt-2">{error}<br/>id: {id}<br/>slugAndId: {params.slugAndId}</div>
        </div>
      </main>
    );
  }

  if (!okr) {
    // Loading state (should be rare in SSR, but fallback for suspense)
    return (
      <main className="container mx-auto p-6 max-w-3xl">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
          <div className="mt-8 h-24 bg-gray-100 rounded" />
        </div>
      </main>
    );
  }

  // --- Details Layout ---
  return (
    <main className="container mx-auto p-6 max-w-3xl">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 break-words">{okr.objective}</h1>
            <div className="flex items-center gap-3 mt-2">
              {/* Status Badge */}
              <span className={`inline-block px-2 py-0.5 rounded-full font-semibold border text-xs capitalize ${okr.status === 'on_track' ? 'bg-blue-100 text-blue-700 border-blue-200' : okr.status === 'at_risk' ? 'bg-red-100 text-red-700 border-red-200' : okr.status === 'off_track' ? 'bg-orange-100 text-orange-700 border-orange-200' : okr.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{okr.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
              {/* Due Date */}
              {okr.endDate && (
                <span className="inline-block bg-[#FAFAFB] text-[#0071E1] px-2 py-0.5 rounded-full font-medium border border-[#B3BCC5]" aria-label={`Due date: ${okr.endDate}`}>Due: {new Date(okr.endDate).toLocaleDateString()}</span>
              )}
              {/* Goal Type */}
              {okr.goalType && (
                <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium border border-gray-200">{okr.goalType === 'individual' ? 'Individual Goal' : okr.goalType === 'team' ? 'Team Goal' : okr.goalType}</span>
              )}
            </div>
          </div>
          {/* Actions menu in client boundary */}
          <div className="flex justify-end">
            {/* Client component: OkrDetailsActions */}
            <OkrDetailsActions okr={okr} />
          </div>
        </div>
        {/* Meta Row: Owners */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-gray-400 mr-1">Owners:</span>
          {okr.owners && Array.isArray(okr.owners) && okr.owners.length > 0 ? (
            <div className="flex -space-x-3">
              {okr.owners.slice(0, 3).map((owner: any, idx: number) => (
                <img
                  key={owner._id || idx}
                  src={owner.avatarUrl || '/avatars/default.svg'}
                  alt={owner.name || 'Owner'}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                />
              ))}
              {okr.owners.length > 3 && (
                <span className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-gray-400 rounded-full ring-2 ring-white shadow-sm ml-1" title={`${okr.owners.length - 3} more owners`} aria-label={`${okr.owners.length - 3} more owners`}>
                  +{okr.owners.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">No owners</span>
          )}
        </div>
        {/* Progress Visualization */}
        {okr.keyResults && Array.isArray(okr.keyResults) && okr.keyResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">Progress</h2>
            {/* Average percent progress ring (placeholder) */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                {/* TODO: Use ProgressRing component for visual ring */}
                <svg viewBox="0 0 36 36" className="w-16 h-16">
                  <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" strokeWidth="4" />
                  <path className="text-blue-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" strokeWidth="4" strokeDasharray={`${Math.round(((okr.keyResults.filter((kr: any) => kr.type === 'percent').reduce((sum: number, kr: any) => sum + (kr.progress || 0), 0) / (okr.keyResults.filter((kr: any) => kr.type === 'percent').length || 1))) || 0)}, 100`} strokeLinecap="round" />
                  <text x="18" y="20.35" className="text-base fill-blue-700 font-semibold" textAnchor="middle">{Math.round(((okr.keyResults.filter((kr: any) => kr.type === 'percent').reduce((sum: number, kr: any) => sum + (kr.progress || 0), 0) / (okr.keyResults.filter((kr: any) => kr.type === 'percent').length || 1))) || 0)}%</text>
                </svg>
              </div>
              <span className="text-sm text-gray-600">Avg. progress across {okr.keyResults.filter((kr: any) => kr.type === 'percent').length} key result(s)</span>
            </div>
          </div>
        )}
        {/* Key Results List */}
        {okr.keyResults && Array.isArray(okr.keyResults) && okr.keyResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">Key Results</h2>
            <ul className="space-y-3">
              {okr.keyResults.map((kr: any, idx: number) => (
                <li key={kr.krId || idx} className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-gray-100">
                  <div>
                    <span className="font-medium text-gray-800">{kr.title}</span>
                    <span className="ml-2 text-xs text-gray-500">[{kr.type === 'percent' ? 'Percent' : 'Target'}]</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {kr.type === 'percent' && typeof kr.progress === 'number' && (
                      <span className="text-sm font-mono text-blue-700">{kr.progress}%</span>
                    )}
                    {kr.type === 'target' && (
                      <span className="text-sm font-mono text-green-700">{kr.current} / {kr.target} {kr.unit || ''}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Description */}
        {okr.description && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">Description</h2>
            <div className="prose prose-sm max-w-none text-gray-700">{okr.description}</div>
          </div>
        )}
        
        {/* Comments Section */}
        <div className="border-t border-gray-200 pt-8">
          <CommentSection 
            okrId={id} 
            currentUser={currentUser} 
            users={users} 
          />
        </div>
      </div>
    </main>
  );
}
