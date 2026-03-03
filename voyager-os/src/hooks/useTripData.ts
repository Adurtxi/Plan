import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { initDB } from '../lib/db';
import type { LocationItem, TransportSegment, TripVariant } from '../types';
import { useAppStore } from '../store';

// ==========================================
// QUERIES
// ==========================================

export const useTripVariants = () => {
  return useQuery({
    queryKey: ['tripVariants'],
    queryFn: async () => {
      const db = await initDB();
      return db.getAll('tripVariants');
    }
  });
};

export const useLocations = () => {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const db = await initDB();
      return db.getAll('locations');
    },
  });
};

export const useChecklist = () => {
  return useQuery({
    queryKey: ['checklist'],
    queryFn: async () => {
      const db = await initDB();
      return db.getAll('checklist');
    }
  });
};

export const useTransports = () => {
  return useQuery({
    queryKey: ['transports'],
    queryFn: async () => {
      const db = await initDB();
      return db.getAll('transports');
    }
  });
};

export const useReservations = () => {
  return useQuery({
    queryKey: ['reservations'],
    queryFn: async () => {
      const db = await initDB();
      return db.getAll('reservations');
    }
  });
};

// ==========================================
// MUTATIONS (Locations)
// ==========================================

export const useAddLocation = () => {
  const queryClient = useQueryClient();
  const saveLocationHistory = useAppStore(s => s.saveLocationHistory);

  return useMutation({
    mutationFn: async (loc: LocationItem) => {
      saveLocationHistory();
      const db = await initDB();

      if (!loc.order) {
        loc.order = Date.now();
      }

      await db.put('locations', loc);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    }
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  const saveLocationHistory = useAppStore(s => s.saveLocationHistory);

  return useMutation({
    mutationFn: async (loc: LocationItem) => {
      saveLocationHistory();
      const db = await initDB();
      await db.put('locations', loc);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    }
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  const saveLocationHistory = useAppStore(s => s.saveLocationHistory);

  return useMutation({
    mutationFn: async (id: number) => {
      saveLocationHistory();
      const db = await initDB();
      await db.delete('locations', id);

      const transports = await db.getAll('transports');
      for (const t of transports) {
        if (t.fromLocationId === id || t.toLocationId === id) {
          await db.delete('transports', t.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['transports'] });
    }
  });
};

// ==========================================
// MUTATIONS (Checklist)
// ==========================================

export const useAddChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const db = await initDB();
      await db.add('checklist', { id: Date.now(), text, done: false });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist'] })
  });
};

export const useToggleChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: number, done: boolean }) => {
      const db = await initDB();
      const item = await db.get('checklist', id);
      if (item) {
        item.done = done;
        await db.put('checklist', item);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist'] })
  });
};

export const useDeleteChecklistItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const db = await initDB();
      await db.delete('checklist', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist'] })
  });
};

// ==========================================
// MUTATIONS (Transports)
// ==========================================

export const useAddTransport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transport: TransportSegment) => {
      const db = await initDB();
      await db.put('transports', transport);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transports'] })
  });
};

export const useUpdateTransport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transport: TransportSegment) => {
      const db = await initDB();
      await db.put('transports', transport);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transports'] })
  });
};

export const useDeleteTransport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const db = await initDB();
      await db.delete('transports', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transports'] })
  });
};

export const useAddRoutePoint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ transportId, lat, lng }: { transportId: string, lat: number, lng: number }) => {
      const db = await initDB();
      const transport = await db.get('transports', transportId);
      if (!transport) return;

      if (!transport.polyline) {
        transport.polyline = [];
      }

      transport.polyline.push([lat, lng]);
      transport.durationCalculated = 0;
      await db.put('transports', transport);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transports'] })
  });
};

// ==========================================
// MUTATIONS (Reservations)
// ==========================================

export const useAddReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reservation: import('../types').ReservationItem) => {
      const db = await initDB();
      await db.put('reservations', reservation);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] })
  });
};

export const useUpdateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reservation: import('../types').ReservationItem) => {
      const db = await initDB();
      await db.put('reservations', reservation);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] })
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const db = await initDB();
      await db.delete('reservations', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] })
  });
};

// ==========================================
// MUTATIONS (Trip Variants)
// ==========================================

export const useAddTripVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variant: TripVariant) => {
      const db = await initDB();
      await db.put('tripVariants', variant);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tripVariants'] })
  });
};

export const useUpdateTripVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variant: TripVariant) => {
      const db = await initDB();
      await db.put('tripVariants', variant);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tripVariants'] })
  });
};

export const useDeleteTripVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const db = await initDB();
      await db.delete('tripVariants', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tripVariants'] })
  });
};

// ==========================================
// Helper functions for Date Sync
// ==========================================
// Since these are synchronous logic, we can expose them or keep them localized in a hook.



// Helper functions for Date Sync

// ... More mutations (reorder, merge, etc) will be extracted to `useTripMutations.ts` or added here.
