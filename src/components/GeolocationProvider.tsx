import { publicIpv4, publicIpv6 } from 'public-ip';
import React, { useEffect, useRef } from 'react';
import { useGeolocated } from 'react-geolocated';
import { reverseGeocode } from '../services/geocoding';
import { useLogStore } from '../store/useLogStore';

export const GeolocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: true,
    },
    watchPosition: true,
    userDecisionTimeout: 5000,
  });

  const updateGeolocation = useLogStore(state => state.updateGeolocation);
  const updateIpAddresses = useLogStore(state => state.updateIpAddresses);
  const lastGeocodeRef = useRef<string>('');

  useEffect(() => {
    if (!coords) return;
    const key = `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
    if (lastGeocodeRef.current === key) return;
    lastGeocodeRef.current = key;

    const run = async () => {
      updateGeolocation({ latitude: coords.latitude, longitude: coords.longitude });
      const geo = await reverseGeocode(coords.latitude, coords.longitude);
      if (geo.city || geo.state || geo.country) {
        updateGeolocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          city: geo.city,
          state: geo.state,
          country: geo.country,
        });
      }
    };
    run();
  }, [coords, updateGeolocation]);

  useEffect(() => {
    const fetchIps = async () => {
      try {
        const [ipv4, ipv6] = await Promise.allSettled([
          publicIpv4({ timeout: 5000 }),
          publicIpv6({ timeout: 5000 }),
        ]);
        const v4 = ipv4.status === 'fulfilled' ? ipv4.value : undefined;
        const v6 = ipv6.status === 'fulfilled' ? ipv6.value : undefined;
        updateIpAddresses({ ipv4: v4, ipv6: v6 });
      } catch (error) {
        if (import.meta.env.DEV) console.warn('Failed to fetch IP addresses:', error);
        updateIpAddresses({});
      }
    };

    fetchIps();
  }, [updateIpAddresses]);

  if (import.meta.env.DEV && !isGeolocationAvailable) {
    console.warn('Geolocation is not supported by your browser');
  }

  if (import.meta.env.DEV && !isGeolocationEnabled) {
    console.warn('Geolocation permissions not granted');
  }

  return <>{children}</>;
};