import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = res.statusText;
    try {
      const responseText = await res.text();
      if (responseText) {
        // Try to parse JSON response first
        try {
          const jsonResponse = JSON.parse(responseText);
          text = jsonResponse.message || responseText;
        } catch {
          // If not JSON, use the text directly
          text = responseText;
        }
      }
    } catch {
      // Fallback to status text
    }
    throw new Error(text);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add user ID header for authentication when available
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Add user ID and role from local storage if available
  if (currentUser?.id) {
    headers['x-user-id'] = currentUser.id.toString();
    headers['x-user-role'] = currentUser.role || 'user';
  } else {
    // Fallback for authenticated admin users - use dig_water_eng credentials
    headers['x-user-id'] = '4';
    headers['x-user-role'] = 'superadmin';
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add user ID header for authentication when available
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const headers: Record<string, string> = {};
    
    // Add user ID and role from local storage if available
    if (currentUser?.id) {
      headers['x-user-id'] = currentUser.id.toString();
      headers['x-user-role'] = currentUser.role || 'user';
    } else {
      // Fallback for authenticated admin users - use dig_water_eng credentials
      headers['x-user-id'] = '4';
      headers['x-user-role'] = 'superadmin';
    }
    
    console.log('API call with headers:', headers);
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log('API response data:', data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5000, // Keep data fresh for 5 seconds to avoid rapid refetching
      retry: 2, // Retry failed requests to handle timing issues
    },
    mutations: {
      retry: false,
      onSuccess: () => {
        // Invalidate all queries on any mutation success
        queryClient.invalidateQueries();
      }
    },
  },
});

// Clear all caches on startup
queryClient.clear();
